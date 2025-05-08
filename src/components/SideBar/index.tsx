"use client"

import { Menu, Search, MessageSquare, PenSquare, User, MoreVertical, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface Conversation {
  id: number | string
  title: string
  icon?: string
  active?: boolean
  isDateLabel?: boolean
  messages?: {
    role: "user" | "assistant"
    content: string
  }[]
}

interface SidebarProps {
  isOpen: boolean
  toggleSidebar: () => void
  onNewChat: () => void
  groupedConversations: Conversation[]
  onSelectConversation: (id: number) => void
  onDeleteConversation: (id: number) => void
}

export default function Sidebar({
  isOpen,
  toggleSidebar,
  onNewChat,
  groupedConversations,
  onSelectConversation,
  onDeleteConversation,
}: SidebarProps) {
  // 跟踪鼠标悬浮的对话项
  const [hoveredConversationId, setHoveredConversationId] = useState<number | string | null>(null)
  // 确认删除对话框状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  // 要删除的对话ID
  const [conversationToDelete, setConversationToDelete] = useState<number | null>(null)

  // 处理删除按钮点击
  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation() // 防止触发对话选择
    setConversationToDelete(id) // 设置要删除的对话ID
    setIsDeleteDialogOpen(true) // 打开确认对话框
  }

  // 确认删除对话
  const confirmDelete = () => {
    if (conversationToDelete !== null) {
      onDeleteConversation(conversationToDelete)
      setIsDeleteDialogOpen(false)
      setConversationToDelete(null)
    }
  }

  // 取消删除对话
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setConversationToDelete(null)
  }

  if (!isOpen) {
    return (
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-10 w-10">
        <Menu className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <div className="w-[280px] h-full bg-background border-r flex flex-col overflow-hidden">
      <div className="flex items-center p-3 border-b">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 ml-2 text-sm font-medium">
          <MessageSquare className="h-4 w-4" />
          <span>新对话</span>
        </div>
        <Button variant="ghost" size="icon" className="ml-auto h-9 w-9" onClick={onNewChat}>
          <PenSquare className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative p-3 border-b">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input placeholder="搜索" className="pl-8" />
      </div>

      <ScrollArea className="flex-1">
        <div className="py-2">
          {groupedConversations.map((item) =>
            item.isDateLabel ? (
              <div key={item.id} className="px-4 py-1 text-xs text-muted-foreground">
                {item.title}
              </div>
            ) : (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 mx-2 rounded-md cursor-pointer relative",
                  item.active ? "bg-accent" : "hover:bg-accent/50",
                )}
                onClick={() => typeof item.id === 'number' && onSelectConversation(item.id)}
                onMouseEnter={() => setHoveredConversationId(item.id)}
                onMouseLeave={() => setHoveredConversationId(null)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate flex-1">{item.title}</span>

                {/* 悬浮显示的三点图标和下拉菜单 */}
                {(hoveredConversationId === item.id || item.active) && !item.isDateLabel && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto"
                        onClick={(e) => e.stopPropagation()} // 防止触发对话选择
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive flex items-center"
                        onClick={(e) => typeof item.id === 'number' && handleDeleteClick(e, item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除对话
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ),
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center gap-2 p-4 border-t">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">Admin</span>
      </div>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个对话吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
