"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "@/lib/use-auth"

interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

interface WebSocketHook {
  socket: Socket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (data: any) => void) => void
  off: (event: string, callback?: (data: any) => void) => void
  connectionError: Error | null
}

export function useWebSocket(options: UseWebSocketOptions = {}): WebSocketHook {
  const { autoConnect = false, reconnection = true, reconnectionAttempts = 5, reconnectionDelay = 1000 } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<Error | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const { user } = useAuth()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    try {
      // تنظيف أي اتصال سابق
      if (socketRef.current) {
        console.log("🛑 Cleaning up previous WebSocket connection")
        socketRef.current.disconnect()
        socketRef.current = null
      }

      // الحصول على عنوان WebSocket
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001"
      console.log(`🔌 Attempting to connect to WebSocket at: ${wsUrl}`)

      // الحصول على token من localStorage أو cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1]

      if (!token) {
        console.warn("⚠️ No auth token found for WebSocket connection")
      }

      // إنشاء اتصال جديد
      socketRef.current = io(wsUrl, {
        auth: {
          token,
        },
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        transports: ["websocket", "polling"],
        reconnection,
        reconnectionAttempts,
        reconnectionDelay,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
      })

      // معالجة الأحداث
      socketRef.current.on("connect", () => {
        console.log("✅ WebSocket connected")
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttemptsRef.current = 0

        // إلغاء أي محاولات إعادة اتصال معلقة
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }
      })

      socketRef.current.on("connection:success", (data) => {
        console.log("✅ WebSocket connection authenticated:", data)
      })

      socketRef.current.on("disconnect", (reason) => {
        console.log("❌ WebSocket disconnected:", reason)
        setIsConnected(false)

        // إعادة الاتصال يدوياً إذا لم يكن السبب هو قطع الاتصال من قبل المستخدم
        if (reason !== "io client disconnect" && reconnection) {
          handleReconnect()
        }
      })

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ WebSocket connection error:", error)
        setIsConnected(false)
        setConnectionError(error)

        // محاولة إعادة الاتصال
        if (reconnection) {
          handleReconnect()
        }
      })

      socketRef.current.on("error", (error) => {
        console.error("❌ WebSocket error:", error)
        setConnectionError(error instanceof Error ? error : new Error(String(error)))
      })
    } catch (error) {
      console.error("❌ Failed to initialize WebSocket:", error)
      setConnectionError(error instanceof Error ? error : new Error(String(error)))
    }
  }, [reconnection, reconnectionAttempts, reconnectionDelay])

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectionAttempts) {
      console.log("❌ Maximum reconnection attempts reached")
      return
    }

    reconnectAttemptsRef.current += 1
    const delay = reconnectionDelay * Math.pow(1.5, reconnectAttemptsRef.current - 1)

    console.log(`🔄 Attempting to reconnect in ${delay / 1000} seconds`)

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Reconnect attempt ${reconnectAttemptsRef.current}/${reconnectionAttempts}`)
      connect()
    }, delay)
  }, [connect, reconnectionAttempts, reconnectionDelay])

  const disconnect = useCallback(() => {
    console.log("🛑 Cleaning up WebSocket connection")

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn("⚠️ WebSocket not connected, cannot emit event:", event)
    }
  }, [])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback)
      } else {
        socketRef.current.off(event)
      }
    }
  }, [])

  // الاتصال التلقائي عند تحميل المكون
  useEffect(() => {
    if (autoConnect && user) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect, user])

  // إعادة الاتصال عند تغيير المستخدم
  useEffect(() => {
    if (user && autoConnect) {
      disconnect()
      connect()
    }
  }, [user, autoConnect, connect, disconnect])

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
    connectionError,
  }
}
