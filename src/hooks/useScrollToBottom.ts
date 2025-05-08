"use client"

import { useRef, useEffect, useState, useCallback } from "react"

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
  
  // 跟踪是否应该滚动到底部
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)

  // 跟踪上一次消息的长度
  const messagesLengthRef = useRef(0)

  // 滚动到底部的函数 - 使用useCallback防止不必要的重新创建
  const scrollToBottom = useCallback(() => {
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
  }, [])

  // 处理滚动事件
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
      if (scrollContainer) {
        // 计算滚动位置
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer
        // 如果距离底部超过200px，显示滚动按钮
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
        setShowScrollButton(!isNearBottom)
        
        // 如果用户已经滚动到底部，下次消息更新时自动滚动到底部
        setShouldScrollToBottom(isNearBottom)
      }
    }
  }, [])

  // 当依赖项变化时检查是否需要滚动到底部
  useEffect(() => {
    // 只检查第一个依赖项，假设它是消息数组
    if (dependencies[0] && dependencies[0].length !== messagesLengthRef.current) {
      // 只有当消息数量增加时才滚动
      if (dependencies[0].length > messagesLengthRef.current && shouldScrollToBottom) {
        // 使用setTimeout确保DOM更新后再滚动
        setTimeout(scrollToBottom, 0)
      }
      messagesLengthRef.current = dependencies[0].length
    }
  }, [...dependencies])

  // 添加滚动事件监听 - 只在组件挂载时添加一次
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [handleScroll])

  return {
    messagesEndRef,
    scrollAreaRef,
    showScrollButton,
    scrollToBottom,
  }
} 