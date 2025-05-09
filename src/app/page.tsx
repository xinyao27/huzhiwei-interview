"use client"

import { useEffect } from "react"
import Sidebar from "@/components/SideBar"
import ChatArea from "@/components/ChatArea"
import NewChatArea from "@/components/NewChatArea"
import { useChatStore } from "@/hooks/useChatStore"
import LoadingSpinner from "@/components/LoadingSpinner"

export default function ChatPage() {
  const {
    // 状态
    groupedConversations,
    currentMessages,
    inputValue,
    isCreatingNewChat,
    isSidebarOpen,
    isLoading,
    isLoadingConversations,

    // 方法
    setInputValue,
    toggleSidebar,
    handleSendMessage,
    handleNewChat,
    handleSelectConversation,
    startNewChat,
    handleDeleteConversation,
    handleRegenerate,
    handleStopGeneration,
  } = useChatStore()

  // 添加日志，检查初始加载状态
  useEffect(() => {
    console.log("页面状态:", {
      isCreatingNewChat,
      isLoadingConversations,
      messagesCount: currentMessages.length,
      groupedConversationsCount: groupedConversations.length
    });
  }, [isCreatingNewChat, isLoadingConversations, currentMessages.length, groupedConversations.length]);

  // 如果对话数据还在加载中，显示加载状态
  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">正在加载对话...</span>
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        onNewChat={startNewChat}
        groupedConversations={groupedConversations}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {isCreatingNewChat ? (
        <NewChatArea isSidebarOpen={isSidebarOpen} onSubmit={handleNewChat} />
      ) : (
        <ChatArea
          messages={currentMessages}
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleSendMessage={handleSendMessage}
          isSidebarOpen={isSidebarOpen}
          handleRegenerate={handleRegenerate}
          handleStopGeneration={handleStopGeneration}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
