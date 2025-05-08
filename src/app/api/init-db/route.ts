import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { initializeDatabase } from '@/lib/db/migrator';
import { seedSampleData } from '@/lib/db/seed-data';

let isInitialized = false;

const app = new Hono().basePath('/api');

// 启动应用时初始化数据库
app.get('/init-db', async (c) => {
  try {
    if (!isInitialized) {
      // 初始化数据库结构
      await initializeDatabase();
      
      // 填充示例数据
      await seedSampleData();
      
      isInitialized = true;
    }
    
    return c.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库初始化失败', error);
    return c.json(
      { success: false, error: '数据库初始化失败' },
      { status: 500 }
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app); 