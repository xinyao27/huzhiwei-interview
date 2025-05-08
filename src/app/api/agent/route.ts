import { Hono } from 'hono';
import { handle } from 'hono/vercel';

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
    const { message } = await c.req.json();
    
    if (!message) {
      return c.json({ error: '消息不能为空' }, { status: 400 });
    }
    
    // 这里可以添加实际的agent处理逻辑
    
    return c.json({
      reply: `您的消息已收到: ${message}`,
      timestamp: new Date().toISOString()
    });
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
