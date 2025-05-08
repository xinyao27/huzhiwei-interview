import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { createOpenAI } from '@ai-sdk/openai';
import { CoreMessage, streamText } from "ai";

const app = new Hono().basePath('/api');

// 获取agent信息
app.get('/agent', async (c) => {
  return c.json({
    status: 'ready',
    version: '1.0.0',
    name: 'Hono助手'
  });
});

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
