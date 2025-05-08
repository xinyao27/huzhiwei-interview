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
      
    // 处理消息内容，确保Markdown格式正确
    const processedMessages = conversationMessages.map(message => {
      if (message.role === 'assistant') {
        // 处理AI助手消息中的Markdown内容
        const content = message.content;
        
        // 判断是否需要处理
        if (!content.includes('```') && !content.includes('\\n')) {
          return message;
        }
        
        let processedContent = content;
        
        // 处理代码块
        if (content.includes('```')) {
          // 匹配代码块的正则表达式
          const codeBlockRegex = /```(\w*)([\s\S]*?)```/g;
          
          processedContent = processedContent.replace(codeBlockRegex, (match, language, codeContent) => {
            // 确保代码内容有适当的换行
            let fixedCode = codeContent.replace(/\\n/g, '\n');
            
            // 添加代码块开始的换行
            if (!fixedCode.startsWith('\n')) {
              fixedCode = '\n' + fixedCode;
            }
            
            // 确保代码块结束前有换行
            if (!fixedCode.endsWith('\n')) {
              fixedCode += '\n';
            }
            
            // 针对JavaScript等常见语言的模式，添加必要的换行
            fixedCode = fixedCode
              // 函数定义后缺少换行
              .replace(/\{(?!\s*\n)/g, '{\n')
              // 语句结束后缺少换行
              .replace(/;(?!\s*\n)/g, ';\n');
            
            // 处理常见代码行开始的模式，确保它们前面有换行
            const commonLineStarts = [
              'const ', 'let ', 'var ', 'function ', 'if ', 'for ', 'while ', 
              'return ', 'class ', 'import ', 'export ', '//', 'console.'
            ];
            
            for (const lineStart of commonLineStarts) {
              const pattern = new RegExp(`([^\\n])${lineStart}`, 'g');
              fixedCode = fixedCode.replace(pattern, `$1\n${lineStart}`);
            }
            
            return '```' + language + fixedCode + '```';
          });
        }
        
        // 处理普通文本中的转义换行符
        if (processedContent.includes('\\n')) {
          processedContent = processedContent.replace(/\\n/g, '\n');
        }
        
        return {
          ...message,
          content: processedContent
        };
      }
      return message;
    });
      
    return NextResponse.json(processedMessages);
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