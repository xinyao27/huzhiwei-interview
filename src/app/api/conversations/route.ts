import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { db, conversations, messages } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { NewConversation } from '@/lib/db/schema';

const app = new Hono().basePath('/api');

// 获取所有对话
app.get('/conversations', async (c) => {
  try {
    const allConversations = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));
    
    return c.json(allConversations);
  } catch (error) {
    console.error("获取对话列表失败", error);
    return c.json(
      { error: "获取对话列表失败" },
      { status: 500 }
    );
  }
});

// 创建新对话
app.post('/conversations', async (c) => {
  try {
    const body = await c.req.json();
    const { title } = body;
    
    if (!title) {
      return c.json(
        { error: "对话标题不能为空" },
        { status: 400 }
      );
    }
    
    // 创建符合类型的数据对象
    const newConversation: NewConversation = { 
      title
    };
    
    // 如果请求中包含其他字段且表结构支持，可以添加到对象中
    
    const result = await db
      .insert(conversations)
      .values(newConversation)
      .returning();
      
    return c.json(result[0]);
  } catch (error) {
    console.error("创建对话失败", error);
    return c.json(
      { error: "创建对话失败" },
      { status: 500 }
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app); 