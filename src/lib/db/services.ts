import { db, conversations, messages, type Conversation, type Message, type NewConversation, type NewMessage } from './index';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * 对话相关操作
 */
export const conversationService = {
  // 获取所有对话，按更新时间倒序
  getAll: async (): Promise<Conversation[]> => {
    return db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  },

  // 获取单个对话
  getById: async (id: number): Promise<Conversation | undefined> => {
    const results = await db.select().from(conversations).where(eq(conversations.id, id));
    return results[0];
  },

  // 创建新对话
  create: async (data: NewConversation): Promise<Conversation> => {
    const result = await db.insert(conversations).values(data).returning();
    return result[0];
  },

  // 更新对话
  update: async (id: number, data: Partial<NewConversation>): Promise<Conversation | undefined> => {
    // 自动添加 updatedAt 字段
    const updateData = {
      ...data,
      updatedAt: sql`(strftime('%s', 'now'))` // 使用 SQL 表达式更新时间
    };
    
    const result = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, id))
      .returning();
    return result[0];
  },

  // 删除对话
  delete: async (id: number): Promise<void> => {
    await db.delete(conversations).where(eq(conversations.id, id));
  },
};

/**
 * 消息相关操作
 */
export const messageService = {
  // 获取对话下的所有消息，按创建时间正序
  getByConversationId: async (conversationId: number): Promise<Message[]> => {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  },

  // 创建新消息
  create: async (data: NewMessage): Promise<Message> => {
    const result = await db.insert(messages).values(data).returning();
    
    // 更新对话的 updatedAt
    if (data.conversationId) {
      await conversationService.update(data.conversationId, {});
    }
    
    return result[0];
  },

  // 批量创建消息
  createMany: async (data: NewMessage[]): Promise<Message[]> => {
    if (data.length === 0) return [];
    const result = await db.insert(messages).values(data).returning();
    
    // 更新对话的 updatedAt（如果所有消息都属于同一个对话）
    const conversationId = data[0]?.conversationId;
    if (conversationId !== undefined && data.every(msg => msg.conversationId === conversationId)) {
      await conversationService.update(conversationId, {});
    }
    
    return result;
  },

  // 删除对话下的所有消息
  deleteByConversationId: async (conversationId: number): Promise<void> => {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
  },
}; 