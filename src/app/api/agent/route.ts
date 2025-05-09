import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { CoreMessage, streamText } from "ai";
import { db, conversations, messages } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { sql } from 'drizzle-orm';

const app = new Hono().basePath('/api');

// 定义获取当前时间的工具
const getCurrentTimeTool = {
  description: "获取当前日期和时间信息",
  parameters: z.object({
    timezone: z.string().optional().describe("时区格式如 'Asia/Shanghai', 'America/New_York' 等。可选，默认为 UTC。"),
    format: z.string().optional().describe("时间格式，如 'full', 'date', 或 'time'。可选，默认为完整日期时间。")
  }),
  execute: async ({ timezone = 'UTC', format = 'full' }) => {
    const date = new Date();
    let formattedDate;
    try {
      const options: Intl.DateTimeFormatOptions = { timeZone: timezone };
      
      switch (format) {
        case 'date':
          options.dateStyle = 'full';
          formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
          break;
        case 'time':
          options.timeStyle = 'full';
          formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
          break;
        default:
          options.dateStyle = 'full';
          options.timeStyle = 'long';
          formattedDate = new Intl.DateTimeFormat('en-US', options).format(date);
      }
      console.log({
        datetime: formattedDate,
        timezone: timezone,
        timestamp: date.getTime()
      });
      return {
        datetime: formattedDate,
        timezone: timezone,
        timestamp: date.getTime()
      };
    } catch (error) {
      // 如果时区无效，回退到 UTC
      return {
        datetime: date.toISOString(),
        timezone: 'UTC',
        timestamp: date.getTime(),
        error: `无效的时区: ${timezone}。使用 UTC 代替。`
      };
    }
  }
};

// 获取消息内容的文本表示
function getMessageContent(message: CoreMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  } else if (Array.isArray(message.content)) {
    // 尝试提取文本部分
    const textParts = message.content
      .filter(part => 'text' in part)
      .map(part => 'text' in part ? part.text : '');
    return textParts.join(' ');
  }
  return '未知内容';
}

// 处理agent请求
app.post('/agent', async (c) => {
  try {
    const { messages: requestMessages, id, isRegenerating }: { 
      messages: CoreMessage[], 
      id?: string,
      isRegenerating?: boolean 
    } = await c.req.json();
    const slicedMessages = requestMessages.slice(-5);
    console.log(slicedMessages, { id, isRegenerating });
    
    // 处理对话数据库操作
    let conversationId: number;
    
    if (id) {
      // 尝试将ID转换为数字
      conversationId = Number(id);
      
      if (isNaN(conversationId)) {
        return c.json(
          { error: "无效的对话ID" },
          { status: 400 }
        );
      }
      
      // 检查对话是否存在
      const existingConversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId));
        
      if (!existingConversation.length) {
        // 创建对话记录
        const firstMessage = slicedMessages[0];
        const title = firstMessage ? getMessageContent(firstMessage).substring(0, 50) : "新对话";
        const result = await db
          .insert(conversations)
          .values({ title })
          .returning();
          
        conversationId = result[0].id;
      } else {
        // 更新对话的updatedAt时间
        await db
          .update(conversations)
          .set({ updatedAt: sql`(strftime('%s', 'now'))` })
          .where(eq(conversations.id, conversationId));
          
        // 如果是重新生成操作，删除最后的AI回复
        if (isRegenerating === true) {
          // 获取当前对话中的最后一条消息
          const lastMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(sql`id DESC`)
            .limit(1);
            
          // 如果最后一条是AI回复，则删除
          if (lastMessages.length > 0 && lastMessages[0].role === 'assistant') {
            await db
              .delete(messages)
              .where(eq(messages.id, lastMessages[0].id));
            console.log('检测到重新生成操作，已删除旧的AI回复:', lastMessages[0].id);
          }
        }
        // 保留之前的检测逻辑作为备用，以防isRegenerating标记不存在
        else if (slicedMessages.length > 0 && slicedMessages[slicedMessages.length - 1].role === 'user') {
          // 获取当前对话中的最后两条消息
          const lastMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(sql`id DESC`)
            .limit(2);
            
          // 如果最后一条是AI回复，且倒数第二条与当前提交的最后一条用户消息相同，则删除最后的AI回复
          if (lastMessages.length >= 2 && 
              lastMessages[0].role === 'assistant' && 
              lastMessages[1].role === 'user' && 
              lastMessages[1].content === getMessageContent(slicedMessages[slicedMessages.length - 1])) {
            await db
              .delete(messages)
              .where(eq(messages.id, lastMessages[0].id));
            console.log('检测到可能的重新生成操作，已删除旧的AI回复:', lastMessages[0].id);
          }
        }
      }
    } else if (slicedMessages.length > 0) {
      // 没有指定ID但有消息，创建新对话
      const firstMessage = slicedMessages[0];
      const title = firstMessage ? getMessageContent(firstMessage).substring(0, 50) : "新对话";
      const result = await db
        .insert(conversations)
        .values({ title })
        .returning();
        
      conversationId = result[0].id;
    } else {
      return c.json(
        { error: "无消息内容" },
        { status: 400 }
      );
    }
    
    // 将用户消息保存到数据库
    for (const message of slicedMessages) {
      const content = getMessageContent(message);
      
      // 检查消息是否已经存在
      const existingMessages = await db
        .select()
        .from(messages)
        .where(and(
          eq(messages.conversationId, conversationId),
          eq(messages.role, message.role as "user" | "assistant"),
          eq(messages.content, content)
        ));
        
      if (existingMessages.length === 0) {
        await db
          .insert(messages)
          .values({
            conversationId,
            role: message.role as "user" | "assistant",
            content
          });
      }
    }
    
    const openai = createOpenAI({
      baseURL: process.env.OPENAI_API_BASE_URL, 
    });
    
    // 尝试从原始请求中获取abort信号
    // Hono的请求对象中，可以通过raw属性访问原始的Request对象
    let abortSignal;
    try {
      const originalRequest = c.req.raw;
      if (originalRequest && originalRequest.signal) {
        abortSignal = originalRequest.signal;
        console.log('成功获取请求的abort信号');
      } else {
        console.log('原始请求对象中没有signal属性，将不支持中断流');
      }
    } catch (error) {
      console.warn('获取abort信号失败:', error);
    }
    
    // 使用Vercel AI SDK的streamText函数
    const streamResponse = await streamText({
      model: openai("gpt-4.1"),
      system: "你是一个AI助手，请根据用户的问题给出准确回答。",
      messages: slicedMessages,
      tools: {
        get_current_time: getCurrentTimeTool
      },
      toolChoice: "auto",
      maxSteps: 10,
      // 仅当成功获取到signal时才传递
      ...(abortSignal ? { abortSignal } : {})
    });
    
    // 转换为DataStream响应
    const response = streamResponse.toDataStreamResponse();
    
    // 在后台将AI的回复保存到数据库
    // 注意：这是一个不等待的操作，因为我们已经返回了流式响应
    (async () => {
      try {
        // 读取响应流并收集完整内容
        const reader = streamResponse.toDataStream().getReader();
        let fullContent = '';
        let messageId: number | null = null;
        let isAborted = false;
        
        // 定义保存内容的函数
        const saveContent = async (content: string, isInterrupted: boolean = false) => {
          if (!content.trim()) return;
          
          try {
            // 如果已经有保存过的消息ID，就更新它
            if (messageId !== null) {
              await db
                .update(messages)
                .set({ 
                  content: content.trim(),
                  // 标记是否被中断，需要在messages表中添加此字段
                  // isInterrupted: isInterrupted
                })
                .where(eq(messages.id, messageId));
            } else {
              // 否则插入新消息
              const result = await db
                .insert(messages)
                .values({
                  conversationId,
                  role: 'assistant',
                  content: content.trim(),
                  // isInterrupted: isInterrupted
                })
                .returning();
              
              // 保存消息ID以便后续更新
              if (result && result.length > 0) {
                messageId = result[0].id;
              }
            }
            
            // 更新对话的updatedAt时间
            await db
              .update(conversations)
              .set({ updatedAt: sql`(strftime('%s', 'now'))` })
              .where(eq(conversations.id, conversationId));
            
            console.log(`已保存${isInterrupted ? '(被中断)' : ''}内容，长度: ${content.length}`);
          } catch (error) {
            console.error('保存内容失败:', error);
          }
        };
        
        try {
          while (true) {
            try {
              // 如果已经被中断，不再继续读取
              if (isAborted) break;
              
              const { done, value } = await reader.read();
              
              if (done) {
                // 流结束，保存完整内容
                await saveContent(fullContent);
                break;
              }
              
              // 解析value以获取内容
              const chunk = new TextDecoder().decode(value);
              let chunkContent = '';
              console.log('chunk', chunk);
              try {
                // 尝试解析JSON格式的数据
                const lines = chunk.split('\n').filter(line => line.trim().startsWith('0:'));
                for (const line of lines) {
                    chunkContent += line.replace('0:', '').replace(/^"|"$/g, '');
                }
              } catch (e) {
                console.warn('解析流数据失败:', e);
              }
              
              fullContent += chunkContent;
            } catch (error) {
              // 捕获可能的AbortError或其他错误，这通常是由于用户中断引起的
              console.log('流式响应被中断或出现错误:', error);
              
              // 标记为已中断
              isAborted = true;
              
              // 保存截至中断时的内容，并标记为被中断
              await saveContent(fullContent, true);
              
              break;
            }
          }
        } finally {
          // 确保在任何情况下都关闭reader
          try {
            if (reader.cancel) {
              await reader.cancel('请求结束');
            }
          } catch (error) {
            console.warn('关闭reader失败:', error);
          }
        }
        
        console.log('流式响应处理完成，内容长度:', fullContent.length);
      } catch (err) {
        console.error('处理流式响应失败:', err);
      }
    })();
    
    return response;
  } catch (error) {
    console.error('处理agent请求失败', error);
    return c.json(
      { error: '处理请求失败' },
      { status: 500 }
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
