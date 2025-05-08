"use client"

import type React from "react"

import { useState } from "react"
import { RotateCcw, Send, Plus, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useScrollToBottom } from "@/hooks/useScrollToBottom"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatAreaProps {
  messages: Message[]
  inputValue: string
  setInputValue: (value: string) => void
  handleSendMessage: (e: React.FormEvent) => void
  isSidebarOpen: boolean
}

export default function ChatArea({
  messages,
  inputValue,
  setInputValue,
  handleSendMessage,
  isSidebarOpen,
}: ChatAreaProps) {
  // 使用自定义 hook 处理滚动逻辑
  const { messagesEndRef, scrollAreaRef, showScrollButton, scrollToBottom } = useScrollToBottom([messages])

  // 用于追踪鼠标悬停的消息索引
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState<number | null>(null)

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 relative",
        !isSidebarOpen ? "w-full" : "",
      )}
    >
      <ScrollArea className="flex-1 p-4 h-72" ref={scrollAreaRef}>
        <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn("flex gap-4 w-full", message.role === "user" ? "justify-end" : "justify-start")}
              onMouseEnter={() => setHoveredMessageIndex(index)}
              onMouseLeave={() => setHoveredMessageIndex(null)}
            >
              <div className={cn("flex gap-3 max-w-[80%]", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-medium">
                    {message.role === "user" ? "你" : "AI"}
                  </div>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-semibold">{message.role === "user" ? "你" : "gpt-4.1"}</div>
                  <div className="text-sm leading-relaxed">{message.content}</div>

                  {message.role === "assistant" && (
                    <div className="flex gap-1 mt-2 h-7">
                      {/* 如果是最后一条消息或者鼠标悬停在消息上，才显示刷新按钮，但保持占位高度 */}
                      {(index === messages.length - 1 || hoveredMessageIndex === index) ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7 cursor-pointer">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="h-7 w-7"></div> // 空白占位符，保持高度
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 这个空的div用于滚动到底部的目标 */}
          <div ref={messagesEndRef} />
        </div>
        {/* 滚动到底部的按钮 */}
        {showScrollButton && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full absolute left-1/2 bottom-10 translate-x-[-50%] z-10 text-black border-gray-300 cursor-pointer"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        )}
      </ScrollArea>

      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2 max-w-[800px] mx-auto">
          <div className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入消息"
              className="min-h-[48px] pr-10 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7",
                !inputValue.trim() && "text-muted-foreground opacity-50",
              )}
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
