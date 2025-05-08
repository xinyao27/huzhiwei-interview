import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db/migrator';
import { seedSampleData } from '@/lib/db/seed-data';

let isInitialized = false;

// 启动应用时初始化数据库
export async function GET() {
  try {
    if (!isInitialized) {
      // 初始化数据库结构
      await initializeDatabase();
      
      // 填充示例数据
      await seedSampleData();
      
      isInitialized = true;
    }
    
    return NextResponse.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    console.error('数据库初始化失败', error);
    return NextResponse.json(
      { success: false, error: '数据库初始化失败' },
      { status: 500 }
    );
  }
} 