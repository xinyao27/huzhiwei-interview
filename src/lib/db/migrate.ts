import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// 确保数据库目录存在
const dbDir = join(process.cwd(), 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// 运行迁移
console.log('Running migrations...');
migrate(db, { migrationsFolder: './drizzle' });
console.log('Migrations complete!'); 