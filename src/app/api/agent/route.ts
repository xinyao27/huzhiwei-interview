import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { CoreMessage, streamText } from "ai";

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

// 处理agent请求
app.post('/agent', async (c) => {
  try {
    const { messages }: { messages: CoreMessage[] } = await c.req.json();
    const slicedMessages = messages.slice(-5);
    console.log(slicedMessages);
    
    const openai = createOpenAI({
      baseURL: process.env.OPENAI_API_BASE_URL, 
    });
    
    const result = await streamText({
      model: openai("gpt-4.1"),
      system: "你是一个AI助手，请根据用户的问题给出准确回答。",
      messages: slicedMessages,
      tools: {
        get_current_time: getCurrentTimeTool
      },
      toolChoice: "auto",
      maxSteps: 10,
    });
    
    return result.toDataStreamResponse();
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
