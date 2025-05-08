"use client"

import Sidebar from "@/components/SideBar"
import ChatArea from "@/components/ChatArea"
import NewChatArea from "@/components/NewChatArea"
import { useChatStore } from "@/hooks/useChatStore"

export default function ChatPage() {
  const {
    // 状态
    groupedConversations,
    currentMessages,
    inputValue,
    isCreatingNewChat,
    isSidebarOpen,
    isLoading,

    // 方法
    setInputValue,
    toggleSidebar,
    handleSendMessage,
    handleNewChat,
    handleSelectConversation,
    startNewChat,
    handleDeleteConversation,
    handleRegenerate,
  } = useChatStore()

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
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
