import fs from 'fs';
import path from 'path';
import { db } from './index';

// 核心表创建SQL
const CORE_TABLES_SQL = `
-- 创建对话表
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- 创建消息表
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
`;

// 检查数据库表是否已存在
export async function ensureTablesExist() {
  try {
    // 使用sqlite低级API直接执行SQL
    const sqlite = (db as any).driver.connection;
    
    // 检查表是否存在
    const tableExists = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'").get();
    
    // 如果核心表不存在，创建它们
    if (!tableExists) {
      console.log('创建核心数据库表...');
      sqlite.exec(CORE_TABLES_SQL);
      console.log('核心数据库表创建完成');
    }
  } catch (error) {
    console.error('确保表存在时出错:', error);
    throw error;
  }
}

// 初始化数据库
export async function initializeDatabase() {
  // 确保数据库目录存在
  const dbDir = path.join(process.cwd(), 'db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // 确保表结构存在
  await ensureTablesExist();
  
  console.log('数据库初始化完成');
} 