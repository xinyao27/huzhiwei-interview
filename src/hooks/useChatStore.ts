"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { useChat, type Message as VercelMessage } from "ai/react"

// 定义对话类型
export interface Conversation {
  id: number
  title: string
  active?: boolean
  updatedAt: number | string // 更新时间戳（秒）或ISO日期字符串
  messages: {
    role: "user" | "assistant"
    content: string
  }[]
}

// 定义本地消息类型
export interface LocalMessage {
  role: "user" | "assistant"
  content: string
}

// 获取所有对话
async function fetchConversations() {
  const response = await fetch('/api/conversations');
  if (!response.ok) {
    throw new Error('获取对话列表失败');
  }
  return response.json();
}

// 获取特定对话的所有消息
async function fetchMessages(conversationId: number) {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) {
    throw new Error(`获取对话消息失败: ${conversationId}`);
  }
  return response.json();
}

// 创建新对话
async function createConversation(title: string) {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error('创建对话失败');
  }
  return response.json();
}

// 更新对话标题
async function updateConversation(id: number, title: string) {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!response.ok) {
    throw new Error(`更新对话失败: ${id}`);
  }
  return response.json();
}

// 删除对话
async function deleteConversation(id: number) {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`删除对话失败: ${id}`);
  }
  return response.json();
}

export function useChatStore() {
  // 所有对话数据
  const [conversations, setConversations] = useState<Conversation[]>([])
  // 对话加载状态
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)

  // 当前选中的对话ID
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)

  // 新建对话状态
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false)

  // 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 用于跟踪是否应该更新对话
  const shouldUpdateConversationsRef = useRef(true)
  
  // 上一次AI消息的长度
  const lastAIMessagesLengthRef = useRef(0)

  // 从Conversation转换为VercelMessage
  const convertToMessages = useCallback((messages: LocalMessage[]): VercelMessage[] => {
    return messages.map(msg => ({
      id: crypto.randomUUID(),
      role: msg.role,
      content: msg.content,
    }));
  }, []);

  // 从VercelMessage转换为LocalMessage
  const convertToLocalMessages = useCallback((messages: VercelMessage[]): LocalMessage[] => {
    return messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));
  }, []);

  // 初始加载所有对话
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const data = await fetchConversations();
        console.log("data", data);
        
        // 格式化从API获取的对话数据
        const formattedConversations = await Promise.all(
          data.map(async (conv: any) => {
            try {
              // 获取对话的消息
              const messagesData = await fetchMessages(conv.id);
              
              // 确保updatedAt是时间戳（秒）
              let timestamp = conv.updatedAt;
              if (typeof timestamp === 'string') {
                timestamp = Math.floor(new Date(timestamp).getTime() / 1000);
              }
              
              return {
                id: conv.id,
                title: conv.title,
                updatedAt: timestamp,
                messages: messagesData.map((msg: any) => ({
                  role: msg.role,
                  content: msg.content
                })),
                active: false
              };
            } catch (error) {
              console.error(`加载对话消息失败: ${conv.id}`, error);
              
              // 确保updatedAt是时间戳（秒）
              let timestamp = conv.updatedAt;
              if (typeof timestamp === 'string') {
                timestamp = Math.floor(new Date(timestamp).getTime() / 1000);
              }
              
              return {
                id: conv.id,
                title: conv.title,
                updatedAt: timestamp,
                messages: [],
                active: false
              };
            }
          })
        );
        
        // 按更新时间排序，最新的对话在前面
        const sortedConversations = formattedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
        console.log("sortedConversations", sortedConversations);
        
        // 设置加载的对话列表，但不选中任何对话，默认处于新建对话状态
        setConversations(sortedConversations);
        setCurrentConversationId(null);
        setIsCreatingNewChat(true);
      } catch (error) {
        console.error('加载对话列表失败', error);
        // 出错时也设置为新建对话状态
        setIsCreatingNewChat(true);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    loadConversations();
  }, []);

  // 找到当前对话的初始消息
  const initialMessages = useMemo(() => {
    const conversation = conversations.find(conv => conv.id === currentConversationId);
    return conversation 
      ? convertToMessages(conversation.messages)
      : [];
  }, [currentConversationId, conversations, convertToMessages]);

  // 使用Vercel的useChat hook
  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    reload,
    setMessages,
    stop
  } = useChat({
    api: "/api/agent", // 使用agent API端点
    id: currentConversationId?.toString(),
    initialMessages,
    body: {
      id: currentConversationId // 传递对话ID给agent API
    },
    onResponse: (response: Response) => {
      // 当收到响应时，对话数据由agent API自动保存到数据库
      // 这里只需更新本地状态即可
      if (currentConversationId && shouldUpdateConversationsRef.current) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const updatedMessages = convertToLocalMessages(aiMessages);
        
        setConversations(prevConversations => {
          // 创建一个新的对话列表，按照更新时间降序排序
          const updatedConversations = prevConversations.map(conv => {
            if (conv.id === currentConversationId) {
              return { 
                ...conv, 
                messages: updatedMessages, 
                updatedAt: currentTimestamp 
              };
            }
            return conv;
          });
          
          // 确保更新后的列表仍然按照更新时间排序
          return updatedConversations;
        });
      }
    }
  })

  // 当前对话的消息 - 从useChat中获取
  const currentMessages = useMemo(() => 
    convertToLocalMessages(aiMessages), [aiMessages, convertToLocalMessages]
  )

  // 监听当前对话ID变化
  useEffect(() => {
    const conversation = conversations.find((conv) => conv.id === currentConversationId)
    if (conversation && conversation.messages) {
      // 暂时禁用更新对话，避免无限循环
      shouldUpdateConversationsRef.current = false;
      
      // 重置useChat的消息，使用当前对话的消息
      const msgs = convertToMessages(conversation.messages);
      setMessages(msgs);
      
      // 重新启用更新对话
      setTimeout(() => {
        shouldUpdateConversationsRef.current = true;
        lastAIMessagesLengthRef.current = msgs.length;
      }, 100);
    }
  }, [currentConversationId, conversations, convertToMessages, setMessages])

  // 监听aiMessages变化，避免不必要的状态更新
  useEffect(() => {
    // 只有当消息数量增加时才更新对话
    if (aiMessages.length !== lastAIMessagesLengthRef.current && shouldUpdateConversationsRef.current) {
      lastAIMessagesLengthRef.current = aiMessages.length;
      
      if (currentConversationId) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const updatedMessages = convertToLocalMessages(aiMessages);
        
        setConversations(prevConversations => {
          // 创建一个新的对话列表
          const updatedConversations = prevConversations.map(conv => {
            if (conv.id === currentConversationId) {
              return { 
                ...conv, 
                messages: updatedMessages, 
                updatedAt: currentTimestamp 
              };
            }
            return conv;
          });
          
          return updatedConversations;
        });
      }
    }
  }, [aiMessages, currentConversationId, convertToLocalMessages]);

  // 切换侧边栏
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  // 重新生成回复
  const handleRegenerate = useCallback(() => {
    // 使用Vercel的reload函数重新生成最后一条消息，并标记这是一个重新生成操作
    reload({
      body: {
        id: currentConversationId,
        isRegenerating: true // 添加重新生成标记
      }
    });
  }, [reload, currentConversationId])
  
  // 停止生成回复
  const handleStopGeneration = useCallback(() => {
    // 使用Vercel的stop函数停止生成
    stop();
  }, [stop])

  // 创建新对话
  const handleNewChat = useCallback(async (message: string) => {
    try {
      // 创建新对话
      const title = message.length > 50 ? message.substring(0, 50) + "..." : message;
      const newConversation = await createConversation(title);
      
      // 更新状态
      const newId = newConversation.id;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      // 确保updatedAt是时间戳（秒）
      let timestamp = newConversation.updatedAt;
      if (typeof timestamp === 'string') {
        timestamp = Math.floor(new Date(timestamp).getTime() / 1000);
      }
      
      // 更新所有对话，将之前的active设为false，新对话设为active
      setConversations((prevConversations) => [
        {
          ...newConversation,
          active: true,
          updatedAt: timestamp || currentTimestamp,
          messages: []
        },
        ...prevConversations.map((conv) => ({ ...conv, active: false })),
      ]);

      // 设置当前对话ID为新对话
      setCurrentConversationId(newId);
      setIsCreatingNewChat(false);

      // 清空当前消息并发送第一条消息
      shouldUpdateConversationsRef.current = false;
      setMessages([]);
      
      setTimeout(() => {
        shouldUpdateConversationsRef.current = true;
        lastAIMessagesLengthRef.current = 0;
        
        append({ 
          role: "user", 
          content: message, 
          id: crypto.randomUUID() 
        }, {
          body: {
            id: newId // 传递对话ID给agent API
          }
        });
      }, 100);
    } catch (error) {
      console.error('创建新对话失败', error);
    }
  }, [append, setMessages]);

  // 发送消息 - 使用useChat的handleSubmit
  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // 如果是创建新对话
    if (isCreatingNewChat) {
      handleNewChat(input);
      return;
    }

    // 使用useChat的handleSubmit
    handleSubmit(e)
  }, [input, handleSubmit, isCreatingNewChat, handleNewChat])

  // 选择对话
  const handleSelectConversation = useCallback((id: number) => {
    // 如果已经是当前选中的对话，不做任何操作
    if (id === currentConversationId) return;
    
    const conversation = conversations.find((conv) => conv.id === id);
    if (conversation) {
      // 设置当前对话ID
      setCurrentConversationId(id);

      // 更新active状态
      setConversations((prevConversations) =>
        prevConversations.map((conv) => ({
          ...conv,
          active: conv.id === id,
        }))
      );

      // 如果正在创建新对话，取消创建状态
      if (isCreatingNewChat) {
        setIsCreatingNewChat(false);
      }
    }
  }, [conversations, isCreatingNewChat, currentConversationId]);

  // 开始创建新对话
  const startNewChat = useCallback(() => {
    // 清空当前消息
    shouldUpdateConversationsRef.current = false;
    setMessages([]);
    
    // 取消所有对话的active状态
    setConversations(prevConversations => 
      prevConversations.map(conv => ({
        ...conv,
        active: false
      }))
    );
    
    // 重置当前对话ID和创建状态
    setCurrentConversationId(null);
    setIsCreatingNewChat(true);
    
    // 重新启用更新对话
    setTimeout(() => {
      shouldUpdateConversationsRef.current = true;
      lastAIMessagesLengthRef.current = 0;
    }, 100);
  }, [setMessages]);

  // 删除对话
  const handleDeleteConversation = useCallback(async (id: number) => {
    try {
      // 调用API删除对话
      await deleteConversation(id);
      
      // 过滤掉要删除的对话
      const newConversations = conversations.filter((conv) => conv.id !== id);
      
      // 如果删除的是当前选中的对话
      if (id === currentConversationId) {
        // 清空当前消息
        shouldUpdateConversationsRef.current = false;
        setMessages([]);
        
        // 找到任意一个对话
        const nextConversation = newConversations[0];
        if (nextConversation) {
          // 设置新的当前对话
          setCurrentConversationId(nextConversation.id);
          
          // 更新conversations状态，设置新的active对话
          setConversations(newConversations.map(conv => ({
            ...conv,
            active: conv.id === nextConversation.id
          })));
          
          // 重新启用更新对话
          setTimeout(() => {
            shouldUpdateConversationsRef.current = true;
            lastAIMessagesLengthRef.current = 0;
          }, 100);
        } else {
          // 如果没有其他对话，创建新对话
          setCurrentConversationId(null);
          setConversations([]); // 清空对话列表
          setIsCreatingNewChat(true);
          
          // 重新启用更新对话
          setTimeout(() => {
            shouldUpdateConversationsRef.current = true;
            lastAIMessagesLengthRef.current = 0;
          }, 100);
        }
      } else {
        // 如果删除的不是当前选中的对话，只需更新对话列表
        setConversations(newConversations);
      }
    } catch (error) {
      console.error(`删除对话失败: ${id}`, error);
    }
  }, [conversations, currentConversationId, setMessages]);

  // 按照日期对对话进行分组
  const getGroupedConversations = useCallback(() => {
    console.log("调用getGroupedConversations，conversations长度:", conversations.length);
    
    // 如果对话为空，返回空数组
    if (!conversations || conversations.length === 0) {
      console.log("没有对话数据，返回空数组");
      return [];
    }
    
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

    const groupedData: any[] = [];

    try {
      // 转换对话的updatedAt为时间戳并按更新时间排序
      const processedConversations = conversations.map(conv => {
        // 如果updatedAt是ISO日期字符串，转换为时间戳（秒）
        let timestamp = conv.updatedAt;
        if (typeof timestamp === 'string') {
          try {
            timestamp = Math.floor(new Date(timestamp).getTime() / 1000);
          } catch (error) {
            console.error("无法解析日期:", timestamp, error);
            timestamp = 0; // 设置一个默认值
          }
        }
        
        return {
          ...conv,
          updatedAt: timestamp
        };
      }).sort((a, b) => b.updatedAt - a.updatedAt);
      
      console.log("处理后的对话数据:", processedConversations);

      // 检查是否有今天的对话
      const todayConversations = processedConversations.filter(
        conv => conv.updatedAt >= todayStart
      );
      if (todayConversations.length > 0) {
        groupedData.push({ id: 'today-group', title: '今天', isDateLabel: true });
        groupedData.push(...todayConversations);
      }

      // 检查是否有昨天的对话
      const yesterdayConversations = processedConversations.filter(
        conv => conv.updatedAt >= yesterdayStart && conv.updatedAt < todayStart
      );
      if (yesterdayConversations.length > 0) {
        groupedData.push({ id: 'yesterday-group', title: '昨天', isDateLabel: true });
        groupedData.push(...yesterdayConversations);
      }

      // 检查是否有前天的对话 
      const twoDaysAgoConversations = processedConversations.filter(
        conv => conv.updatedAt >= twoDaysAgoStart && conv.updatedAt < yesterdayStart
      );
      if (twoDaysAgoConversations.length > 0) {
        groupedData.push({ id: 'two-days-ago-group', title: '前天', isDateLabel: true });
        groupedData.push(...twoDaysAgoConversations);
      }

      // 检查是否有过去一周的对话（不包括今天、昨天和前天）
      const pastWeekConversations = processedConversations.filter(
        conv => conv.updatedAt >= oneWeekAgoStart && conv.updatedAt < twoDaysAgoStart
      );
      if (pastWeekConversations.length > 0) {
        groupedData.push({ id: 'past-week-group', title: '过去7天', isDateLabel: true });
        groupedData.push(...pastWeekConversations);
      }

      // 检查是否有更早的对话
      const earlierConversations = processedConversations.filter(
        conv => conv.updatedAt < oneWeekAgoStart
      );
      if (earlierConversations.length > 0) {
        groupedData.push({ id: 'earlier-group', title: '更早', isDateLabel: true });
        groupedData.push(...earlierConversations);
      }
      
      console.log("分组后的对话数据:", groupedData);
    } catch (error) {
      console.error("分组对话数据时出错:", error);
    }

    return groupedData;
  }, [conversations]);

  // 记忆分组对话结果，避免不必要的重新计算
  const groupedConversations = useMemo(() => getGroupedConversations(), [getGroupedConversations]);

  return {
    // 状态
    conversations,
    currentConversationId,
    currentMessages,
    inputValue: input,
    isCreatingNewChat,
    isSidebarOpen,
    isLoading,
    isLoadingConversations,
    // 用于UI展示的分组对话
    groupedConversations,

    // 方法
    setInputValue: handleInputChange,
    toggleSidebar,
    handleSendMessage: sendMessage,
    handleNewChat,
    handleSelectConversation,
    startNewChat,
    handleDeleteConversation,
    handleRegenerate,
    handleStopGeneration,
  }
}
