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

// 获取特定对话的所有消息
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
    
    // 检查对话是否存在
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
    
    // 获取对话的所有消息
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
      
    return NextResponse.json(conversationMessages);
  } catch (error) {
    console.error("获取消息失败", error);
    return NextResponse.json(
      { error: "获取消息失败" },
      { status: 500 }
    );
  }
}

// 添加消息到对话
export async function POST(request: Request, context: RouteParams) {
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
    
    // 检查对话是否存在
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
    
    const { role, content } = await request.json();
    
    if (!role || !content) {
      return NextResponse.json(
        { error: "消息角色和内容不能为空" },
        { status: 400 }
      );
    }
    
    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { error: "消息角色只能是 'user' 或 'assistant'" },
        { status: 400 }
      );
    }
    
    // 添加消息
    const result = await db
      .insert(messages)
      .values({ conversationId, role, content })
      .returning();
      
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("添加消息失败", error);
    return NextResponse.json(
      { error: "添加消息失败" },
      { status: 500 }
    );
  }
} 