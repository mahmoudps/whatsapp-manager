"use client"

import { createContext, useContext, type ReactNode, useCallback } from "react"
import { useWebSocket } from "@/lib/use-websocket"

export interface IWebSocketContext {
  socket: any | null
  connected: boolean
  connecting: boolean
  error: string | null
  lastMessage: any
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => boolean
  on: (event: string, callback: (data: any) => void) => () => void
}

const WebSocketContext = createContext<IWebSocketContext>({
  socket: null,
  connected: false,
  connecting: false,
  error: null,
  lastMessage: null,
  connect: () => {},
  disconnect: () => {},
  emit: () => false,
  on: () => () => {},
})

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket({})

  const handleOn = useCallback(
    (event: string, handler: (...args: any[]) => void) => ws.on(event, handler),
    [ws],
  )

  return (
    <WebSocketContext.Provider value={{ ...ws, on: handleOn }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  return useContext(WebSocketContext)
}
