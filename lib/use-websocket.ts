"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { logger } from "./logger"

interface UseWebSocketOptions {
  url?: string
  token?: string
  deviceId?: string
  autoConnect?: boolean
}

interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastMessage: any
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url =
      process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
      "wss://wa-api.developments.world/socket.io",
    token,
    deviceId,
    autoConnect = true,
  } = options

  const fullUrl = url

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastMessage: null,
  })

  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    setState((prev) => ({ ...prev, connecting: true, error: null }))

    try {
      const socket = io(fullUrl, {
        auth: token ? { token } : undefined,
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
      })

      socket.on("connect", () => {
        logger.info("✅ WebSocket connected")
        setState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }))

        if (deviceId) {
          socket.emit("join_device", deviceId)
        }
      })

      socket.on("disconnect", (reason) => {
        logger.info("❌ WebSocket disconnected:", reason)
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
        }))

        // Auto-reconnect after 3 seconds
        if (reason !== "io client disconnect") {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      })

      socket.on("connect_error", (error) => {
        logger.error("🚨 WebSocket connection error:", error as Error)
        setState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          error: error.message,
        }))
      })

      // Listen for all events
      socket.onAny((event, data) => {
        setState((prev) => ({
          ...prev,
          lastMessage: { event, data, timestamp: Date.now() },
        }))
      })

      socketRef.current = socket
    } catch (error) {
      logger.error("Failed to create socket:", error as Error)
      setState((prev) => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }))
    }
  }, [fullUrl, token, deviceId])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    setState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
    }))
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
      return true
    }
    return false
  }, [])

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback)
      return () => socketRef.current?.off(event, callback)
    }
    return () => {}
  }, [])

  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [connect, disconnect, autoConnect])

  return {
    ...state,
    connect,
    disconnect,
    emit,
    on,
    socket: socketRef.current,
  }
}
