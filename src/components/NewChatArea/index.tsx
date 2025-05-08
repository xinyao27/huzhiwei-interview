"use client"

import type React from "react"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface NewChatAreaProps {
  isSidebarOpen: boolean
  onSubmit: (message: string) => void
}

export default function NewChatArea({ isSidebarOpen, onSubmit }: NewChatAreaProps) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue)
      setInputValue("")
    }
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-all duration-300",
        !isSidebarOpen ? "w-full" : "",
      )}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[600px]">
            <div className="flex flex-col items-center justify-center my-10">
            <h2 className="text-2xl font-semibold">新对话</h2>
          </div>
          <div className="relative bg-white rounded-lg shadow-md">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="min-h-[48px] pr-10 resize-none border rounded-lg focus-visible:ring-1"
              placeholder="输入消息"
              autoFocus
              onKeyDown={handleKeyDown}
            />
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7",
                !inputValue.trim() && "text-muted-foreground opacity-50",
              )}
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
