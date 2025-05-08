import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { db, conversations, messages } from "@/lib/db";
import { eq } from "drizzle-orm";

const app = new Hono().basePath('/api');

// 获取特定对话
app.get('/conversations/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
      
    if (!conversation.length) {
      return c.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }
    
    return c.json(conversation[0]);
  } catch (error) {
    console.error("获取对话失败", error);
    return c.json(
      { error: "获取对话失败" },
      { status: 500 }
    );
  }
});

// 更新对话
app.put('/conversations/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    const body = await c.req.json();
    const { title } = body;
    
    // 仅更新有效字段
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    
    // 检查请求中是否包含其他可用字段并添加到更新对象中
    // 如果表结构支持这些字段，可以将它们添加到更新对象
    
    const result = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, id))
      .returning();
      
    if (!result.length) {
      return c.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }
    
    return c.json(result[0]);
  } catch (error) {
    console.error("更新对话失败", error);
    return c.json(
      { error: "更新对话失败" },
      { status: 500 }
    );
  }
});

// 删除对话
app.delete('/conversations/:id', async (c) => {
  try {
    const id = Number(c.req.param('id'));
    
    if (isNaN(id)) {
      return c.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    // 删除对话（消息会因为外键约束自动级联删除）
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();
      
    if (!result.length) {
      return c.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("删除对话失败", error);
    return c.json(
      { error: "删除对话失败" },
      { status: 500 }
    );
  }
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app); 