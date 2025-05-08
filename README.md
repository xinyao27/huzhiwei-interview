## 数据库配置与使用

本项目使用 DrizzleORM 和 SQLite 进行数据持久化存储。以下是数据库相关的使用说明：

### 环境变量配置

项目使用环境变量来配置AI连接。请按照以下步骤进行配置：

1. 在项目根目录中复制 `.env.example` 文件为 `.env.local`
2. 根据需要修改 `.env.local` 文件中的值

主要的环境变量包括：

- `OPENAI_API_BASE_URL`: OpenAI API的基础URL
- `OPENAI_API_KEY`: OpenAI API的密钥

### 数据库结构

数据库包含以下表：

- `conversations`: 存储对话信息
  - `id`: 对话ID
  - `title`: 对话标题
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间

- `messages`: 存储消息内容
  - `id`: 消息ID
  - `conversationId`: 所属对话ID
  - `role`: 消息角色（'user' 或 'assistant'）
  - `content`: 消息内容
  - `createdAt`: 创建时间
  - `updatedAt`: 更新时间

### 初始化数据库

在首次运行项目时，需要初始化数据库：

```bash
# 安装依赖（如果尚未安装）
npm install

# 生成数据库迁移文件
npm run db:generate

# 执行数据库迁移
npm run db:migrate

# 填充示例数据
npm run db:seed

# 完成数据库初始化后，执行
npm run dev
```

或者，也可以通过访问以下URL自动初始化数据库：
```
http://localhost:3000/api/init-db
```

### API端点

项目提供了以下API端点用于与数据库交互：

#### 对话相关

- `GET /api/conversations`: 获取所有对话
- `POST /api/conversations`: 创建新对话
- `GET /api/conversations/:id`: 获取特定对话
- `PUT /api/conversations/:id`: 更新对话
- `DELETE /api/conversations/:id`: 删除对话

#### 消息相关

- `GET /api/conversations/:id/messages`: 获取特定对话的所有消息
- `POST /api/conversations/:id/messages`: 添加新消息到对话

### 数据库文件位置

SQLite数据库文件存储在项目根目录的 `db/chat.db` 文件中。

### 前端与数据库集成

要将前端与数据库集成，你可以在 `useChatStore` 钩子中添加数据库访问逻辑。下面是一个集成示例：

```typescript
// src/hooks/useChatStore.ts 中添加
import { useEffect, useState } from "react";
import type { Conversation, Message } from "@/lib/db";

// 从API获取所有对话
const fetchConversations = async () => {
  const response = await fetch("/api/conversations");
  if (!response.ok) throw new Error("获取对话失败");
  return response.json();
};

// 获取特定对话的所有消息
const fetchMessages = async (conversationId: number) => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error("获取消息失败");
  return response.json();
};

// 添加消息到对话
const addMessage = async (conversationId: number, role: "user" | "assistant", content: string) => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, content }),
  });
  if (!response.ok) throw new Error("添加消息失败");
  return response.json();
};

// 修改 useChatStore 中的方法，使用API
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!inputValue.trim()) return;

  // 更新本地状态（用于UI响应）
  const newUserMessage: Message = { role: "user", content: inputValue };
  setCurrentMessages([...currentMessages, newUserMessage]);
  setInputValue("");

  try {
    // 保存用户消息到数据库
    await addMessage(currentConversationId, "user", inputValue);
    
    // 模拟AI回复
    const assistantContent = "我已收到您的消息，这是一个模拟回复。在实际应用中，这里会连接到OpenAI API获取真实回复。";
    
    // 保存AI回复到数据库
    await addMessage(currentConversationId, "assistant", assistantContent);
    
    // 更新本地状态（添加AI回复）
    setCurrentMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
  } catch (error) {
    console.error("发送消息时出错", error);
  }
};
```