"use client"

import type React from "react"

import { useState, useEffect } from "react"

// 定义对话类型
export interface Conversation {
  id: number
  title: string
  icon?: string
  active?: boolean
  updatedAt: number // 更新时间戳（秒）
  messages: {
    role: "user" | "assistant"
    content: string
  }[]
}

// 定义消息类型
export interface Message {
  role: "user" | "assistant"
  content: string
}

export function useChatStore() {
  // 所有对话数据
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 2,
      title: "测试与实验指南",
      active: true,
      updatedAt: Math.floor(Date.now() / 1000), // 当前时间戳（秒）
      messages: [
        {
          role: "assistant",
          content:
            "你好！我是由OpenAI开发的人工智能助手，可以帮助你解答问题、提供信息、写作建议、翻译、聊天等等。你有什么需要帮助的吗？",
        },
        {
          role: "user",
          content: "请介绍一下测试与实验的基本方法",
        },
        {
          role: "assistant",
          content:
            "测试与实验的基本方法包括：\n\n1. **控制变量法**：只改变一个变量，保持其他变量不变，观察结果变化。\n\n2. **对比实验**：设置实验组和对照组，比较结果差异。\n\n3. **随机抽样**：从总体中随机选取样本，确保样本具有代表性。\n\n4. **双盲实验**：参与者和研究人员都不知道谁接受了实际处理，减少主观偏见。\n\n5. **交叉验证**：将数据分成多个子集，轮流用于训练和验证，提高模型可靠性。\n\n这些方法帮助确保实验结果的可靠性和有效性。您需要了解更具体的测试方法吗？",
        },
      ],
    },
    {
      id: 4,
      title: "认识AI助手与功能介绍",
      updatedAt: Math.floor(Date.now() / 1000) - 86400, // 昨天（当前时间 - 1天）
      messages: [
        {
          role: "assistant",
          content: "你好！我是一个AI助手，可以回答问题、提供信息、协助写作等。有什么我可以帮助你的吗？",
        },
        {
          role: "user",
          content: "请介绍一下你的主要功能",
        },
        {
          role: "assistant",
          content:
            "作为AI助手，我的主要功能包括：\n\n1. **回答问题**：提供各种知识领域的信息和解答。\n\n2. **内容创作**：协助撰写文章、邮件、报告等各类文本。\n\n3. **语言翻译**：在不同语言之间进行翻译。\n\n4. **代码辅助**：提供编程建议和代码示例。\n\n5. **创意激发**：提供创意想法和解决方案。\n\n6. **数据分析**：帮助理解和解释数据。\n\n7. **学习辅导**：解释复杂概念和提供学习资源。\n\n您有特定的任务需要我协助完成吗？",
        },
      ],
    },
    {
      id: 5,
      title: "Python编程基础",
      updatedAt: Math.floor(Date.now() / 1000) - 86400, // 昨天（当前时间 - 1天）
      messages: [
        {
          role: "user",
          content: "Python中如何定义函数？",
        },
        {
          role: "assistant",
          content:
            '在Python中定义函数使用`def`关键字，基本语法如下：\n\n```python\ndef 函数名(参数1, 参数2, ...):\n    # 函数体\n    # 可以包含多行代码\n    return 返回值  # 可选\n```\n\n例如，一个简单的加法函数：\n\n```python\ndef add(a, b):\n    result = a + b\n    return result\n\n# 调用函数\nsum = add(5, 3)  # sum的值为8\n```\n\nPython函数的一些特点：\n\n1. 可以设置默认参数值：`def greet(name="Guest"):`\n2. 可以使用可变参数：`def sum_all(*numbers):`\n3. 可以使用关键字参数：`def person(name, **properties):`\n4. 可以指定参数类型和返回值类型（Python 3.5+）：`def add(a: int, b: int) -> int:`\n\n需要更详细的例子吗？',
        },
      ],
    },
  ])

  // 当前选中的对话ID
  const [currentConversationId, setCurrentConversationId] = useState(2)

  // 当前对话的消息
  const [currentMessages, setCurrentMessages] = useState<Message[]>([])

  // 输入框的值
  const [inputValue, setInputValue] = useState("")

  // 新建对话状态
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  // 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 当选中的对话变化时，更新当前消息
  useEffect(() => {
    const conversation = conversations.find((conv) => conv.id === currentConversationId)
    if (conversation && conversation.messages) {
      setCurrentMessages(conversation.messages)
    } else {
      setCurrentMessages([])
    }
  }, [currentConversationId, conversations])

  // 切换侧边栏
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  // 发送消息
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const newMessages: Message[] = [...currentMessages, { role: "user", content: inputValue }]
    setCurrentMessages(newMessages)

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // 更新conversations中的消息和updatedAt
    setConversations((prevConversations) =>
      prevConversations.map((conv) => 
        conv.id === currentConversationId 
          ? { ...conv, messages: newMessages, updatedAt: currentTimestamp } 
          : conv
      ),
    )

    setInputValue("")

    // 模拟AI回复
    setTimeout(() => {
      const responseMessages: Message[] = [
        ...newMessages,
        {
          role: "assistant",
          content: "我已收到您的消息，这是一个模拟回复。在实际应用中，这里会连接到OpenAI API获取真实回复。",
        },
      ]

      setCurrentMessages(responseMessages)

      // 更新conversations中的消息
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === currentConversationId ? { ...conv, messages: responseMessages, updatedAt: currentTimestamp } : conv
        ),
      )
    }, 1000)
  }

  // 创建新对话
  const handleNewChat = (message: string) => {
    // 创建新对话
    const newId = Math.max(...conversations.map((c) => c.id)) + 1
    const newConversation: Conversation = {
      id: newId,
      title: message.length > 20 ? message.substring(0, 20) + "..." : message,
      icon: "pen",
      updatedAt: Math.floor(Date.now() / 1000), // 当前时间戳（秒）
      messages: [
        { role: "user", content: message },
        {
          role: "assistant",
          content: "这是一个新的对话。我已收到您的消息，这是一个模拟回复。",
        },
      ],
    }

    // 更新所有对话，将之前的active设为false，新对话设为active
    setConversations((prevConversations) => [
      ...prevConversations.map((conv) => ({ ...conv, active: false })),
      newConversation,
    ])

    // 设置当前对话ID为新对话
    setCurrentConversationId(newId)
    setIsCreatingNewChat(false)
  }

  // 选择对话
  const handleSelectConversation = (id: number) => {
    const conversation = conversations.find((conv) => conv.id === id)
    if (conversation) {
      setCurrentConversationId(id)

      // 更新active状态
      setConversations((prevConversations) =>
        prevConversations.map((conv) => ({
          ...conv,
          active: conv.id === id,
        })),
      )

      // 如果正在创建新对话，取消创建状态
      if (isCreatingNewChat) {
        setIsCreatingNewChat(false)
      }
    }
  }

  // 开始创建新对话
  const startNewChat = () => {
    setIsCreatingNewChat(true)
  }

  // 删除对话
  const handleDeleteConversation = (id: number) => {
    // 过滤掉要删除的对话
    const newConversations = conversations.filter((conv) => conv.id !== id)
    setConversations(newConversations)

    // 如果删除的是当前选中的对话，则选择另一个对话
    if (id === currentConversationId) {
      // 找到任意一个对话
      const nextConversation = newConversations[0]
      if (nextConversation) {
        setCurrentConversationId(nextConversation.id)
        // 设置为active
        setConversations((prevConversations) =>
          prevConversations.map((conv) => ({
            ...conv,
            active: conv.id === nextConversation.id,
          })),
        )
      } else {
        // 如果没有其他对话，创建新对话
        setIsCreatingNewChat(true)
      }
    }
  }

  // 按照日期对对话进行分组
  const getGroupedConversations = () => {
    const now = Math.floor(Date.now() / 1000);
    const oneDayInSeconds = 86400; // 一天的秒数
    const twoDaysInSeconds = oneDayInSeconds * 2;
    const oneWeekInSeconds = oneDayInSeconds * 7;

    // 获取今天的凌晨时间戳
    const todayStart = now - (now % oneDayInSeconds);
    // 获取昨天的凌晨时间戳 
    const yesterdayStart = todayStart - oneDayInSeconds;
    // 获取前天的凌晨时间戳
    const twoDaysAgoStart = yesterdayStart - oneDayInSeconds;
    // 获取一周前的凌晨时间戳
    const oneWeekAgoStart = todayStart - oneWeekInSeconds;

    const groupedData = [];

    // 检查是否有今天的对话
    const todayConversations = conversations.filter(
      conv => conv.updatedAt >= todayStart
    );
    if (todayConversations.length > 0) {
      groupedData.push({ id: 'today-group', title: '今天', isDateLabel: true });
      groupedData.push(...todayConversations);
    }

    // 检查是否有昨天的对话
    const yesterdayConversations = conversations.filter(
      conv => conv.updatedAt >= yesterdayStart && conv.updatedAt < todayStart
    );
    if (yesterdayConversations.length > 0) {
      groupedData.push({ id: 'yesterday-group', title: '昨天', isDateLabel: true });
      groupedData.push(...yesterdayConversations);
    }

    // 检查是否有前天的对话 
    const twoDaysAgoConversations = conversations.filter(
      conv => conv.updatedAt >= twoDaysAgoStart && conv.updatedAt < yesterdayStart
    );
    if (twoDaysAgoConversations.length > 0) {
      groupedData.push({ id: 'two-days-ago-group', title: '前天', isDateLabel: true });
      groupedData.push(...twoDaysAgoConversations);
    }

    // 检查是否有过去一周的对话（不包括今天、昨天和前天）
    const pastWeekConversations = conversations.filter(
      conv => conv.updatedAt >= oneWeekAgoStart && conv.updatedAt < twoDaysAgoStart
    );
    if (pastWeekConversations.length > 0) {
      groupedData.push({ id: 'past-week-group', title: '过去7天', isDateLabel: true });
      groupedData.push(...pastWeekConversations);
    }

    // 检查是否有更早的对话
    const earlierConversations = conversations.filter(
      conv => conv.updatedAt < oneWeekAgoStart
    );
    if (earlierConversations.length > 0) {
      groupedData.push({ id: 'earlier-group', title: '更早', isDateLabel: true });
      groupedData.push(...earlierConversations);
    }

    return groupedData;
  };

  return {
    // 状态
    conversations,
    currentConversationId,
    currentMessages,
    inputValue,
    isCreatingNewChat,
    isSidebarOpen,
    // 用于UI展示的分组对话
    groupedConversations: getGroupedConversations(),

    // 方法
    setInputValue,
    toggleSidebar,
    handleSendMessage,
    handleNewChat,
    handleSelectConversation,
    startNewChat,
    handleDeleteConversation,
  }
}
