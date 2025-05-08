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
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 解析value以获取内容
          // 这里假设value是一个包含文本的数据块
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
        }
        console.log('收集到的完整AI回复:', fullContent);
        // 保存完整响应到数据库
        if (fullContent.trim()) {
          // 处理fullContent，保留真正的换行符并确保代码块格式正确
          // 注意：LLM生成的Markdown代码块需要三个反引号和换行才能正确显示
          
          // 解析和修复代码块
          let processedContent = fullContent;
          
          if (processedContent.includes('```')) {
            // 匹配代码块的正则表达式
            const codeBlockRegex = /```(\w*)([\s\S]*?)```/g;
            
            processedContent = processedContent.replace(codeBlockRegex, (match, language, codeContent) => {
              // 确保代码内容有适当的换行
              let fixedCode = codeContent;
              
              // 添加代码块开始的换行
              if (!fixedCode.startsWith('\n')) {
                fixedCode = '\n' + fixedCode;
              }
              
              // 确保代码块结束前有换行
              if (!fixedCode.endsWith('\n')) {
                fixedCode += '\n';
              }          
              return '```' + language + fixedCode + '```';
            });
          }         
          await db
            .insert(messages)
            .values({
              conversationId,
              role: 'assistant',
              content: processedContent
            });
            
          // 更新对话的updatedAt时间
          await db
            .update(conversations)
            .set({ updatedAt: sql`(strftime('%s', 'now'))` })
            .where(eq(conversations.id, conversationId));
        }
      } catch (err) {
        console.error('保存AI回复到数据库失败:', err);
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
