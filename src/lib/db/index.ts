import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 确保数据库目录存在
const dbDir = join(process.cwd(), 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// 初始化SQLite数据库连接
// 注意：在生产环境中，可能需要考虑连接池和更复杂的配置
let sqlite: Database.Database;

// 避免在开发模式下热重载时多次初始化
function getSqliteInstance() {
  if (!sqlite) {
    sqlite = new Database(join(dbDir, 'chat.db'));

    // SQLite配置
    sqlite.pragma('journal_mode = WAL'); // 性能优化
    sqlite.pragma('foreign_keys = ON'); // 启用外键约束
  }
  return sqlite;
}

// 创建Drizzle ORM实例
export const db = drizzle(getSqliteInstance(), { schema });

// 导出schema以便在其他文件中使用
export * from './schema'; 