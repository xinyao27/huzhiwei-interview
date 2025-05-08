"use client"

import { useRef, useEffect, useState } from "react"

/**
 * 自定义 Hook，用于处理聊天消息区域的滚动逻辑
 * @param dependencies 触发滚动到底部的依赖项数组，比如消息列表
 * @returns 滚动相关的状态和方法
 */
export function useScrollToBottom(dependencies: any[] = []) {
  // 创建一个ref来引用消息容器底部
  const messagesEndRef = useRef<HTMLDivElement>(null)
  // 创建一个ref来引用滚动区域
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 状态来跟踪是否显示滚动到底部的按钮
  const [showScrollButton, setShowScrollButton] = useState(false)

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }

    // 如果使用ScrollArea组件，也可以直接设置scrollTop
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }

    // 滚动到底部后隐藏按钮
    setShowScrollButton(false)
  }

  // 处理滚动事件
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollContainer) {
        // 计算滚动位置
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer
        // 如果距离底部超过200px，显示滚动按钮
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
        setShowScrollButton(!isNearBottom)
      }
    }
  }

  // 当依赖项变化时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, dependencies)

  // 添加滚动事件监听
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  return {
    messagesEndRef,
    scrollAreaRef,
    showScrollButton,
    scrollToBottom,
  }
} 