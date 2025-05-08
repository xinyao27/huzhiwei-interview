import { NextResponse } from "next/server";
import { db, conversations, messages } from "@/lib/db";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{
    id: string;
  }> | {
    id: string;
  };
}

// 获取特定对话
export async function GET(request: Request, context: RouteParams) {
  try {
    // 确保params是可用的
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少对话ID" },
        { status: 400 }
      );
    }
    
    const conversationId = Number(id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));
      
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
export async function PUT(request: Request, context: RouteParams) {
  try {
    // 确保params是可用的
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少对话ID" },
        { status: 400 }
      );
    }
    
    const conversationId = Number(id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { title } = body;
    
    // 仅更新有效字段
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    
    // 检查请求中是否包含其他可用字段并添加到更新对象中
    // 如果表结构支持这些字段，可以将它们添加到更新对象
    
    const result = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId))
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
export async function DELETE(request: Request, context: RouteParams) {
  try {
    // 确保params是可用的
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "缺少对话ID" },
        { status: 400 }
      );
    }
    
    const conversationId = Number(id);
    
    if (isNaN(conversationId)) {
      return NextResponse.json(
        { error: "无效的对话ID" },
        { status: 400 }
      );
    }
    
    // 删除对话（消息会因为外键约束自动级联删除）
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, conversationId))
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