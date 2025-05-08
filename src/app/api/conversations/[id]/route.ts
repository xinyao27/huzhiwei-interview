import { NextResponse } from "next/server";
import { db, conversations, messages } from "@/lib/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: {
    id: string;
  };
}

// 获取特定对话
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
      
    if (!conversation.length) {
      return NextResponse.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(conversation[0]);
  } catch (error) {
    console.error("获取对话失败", error);
    return NextResponse.json(
      { error: "获取对话失败" },
      { status: 500 }
    );
  }
}

// 更新对话
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    const { title, type, icon } = await request.json();
    
    const result = await db
      .update(conversations)
      .set({ title, type, icon })
      .where(eq(conversations.id, id))
      .returning();
      
    if (!result.length) {
      return NextResponse.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("更新对话失败", error);
    return NextResponse.json(
      { error: "更新对话失败" },
      { status: 500 }
    );
  }
}

// 删除对话
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
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
      return NextResponse.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除对话失败", error);
    return NextResponse.json(
      { error: "删除对话失败" },
      { status: 500 }
    );
  }
} 