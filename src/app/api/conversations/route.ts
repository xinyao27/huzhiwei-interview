import { NextResponse } from "next/server";
import { db, conversations, messages } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

// 获取所有对话
export async function GET() {
  try {
    const allConversations = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.createdAt));
    
    return NextResponse.json(allConversations);
  } catch (error) {
    console.error("获取对话列表失败", error);
    return NextResponse.json(
      { error: "获取对话列表失败" },
      { status: 500 }
    );
  }
}

// 创建新对话
export async function POST(request: Request) {
  try {
    const { title, type, icon } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: "对话标题不能为空" },
        { status: 400 }
      );
    }
    
    const result = await db
      .insert(conversations)
      .values({ title, type, icon })
      .returning();
      
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("创建对话失败", error);
    return NextResponse.json(
      { error: "创建对话失败" },
      { status: 500 }
    );
  }
} 