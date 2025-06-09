"use client"

import { createContext, useContext, type ReactNode, useCallback } from "react"
import { useWebSocket } from "./use-websocket"

interface WebSocketContextType {
  connected: boolean
  connecting: boolean
  error: string | null
  lastMessage: any
  emit: (event: string, data?: any) => boolean
  on: (event: string, handler: (...args: any[]) => void) => () => void
  connect: () => void
  disconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  connecting: false,
  error: null,
  lastMessage: null,
  emit: () => false,
  on: () => () => {},
  connect: () => {},
  disconnect: () => {},
})

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const ws = useWebSocket()

  const handleOn = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      return ws.on(event, handler)
    },
    [ws],
  )

  return (
    <WebSocketContext.Provider
      value={{
        connected: ws.connected,
        connecting: ws.connecting,
        error: ws.error,
        lastMessage: ws.lastMessage,
        emit: ws.emit,
        on: handleOn,
        connect: ws.connect,
        disconnect: ws.disconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocketContext() {
  return useContext(WebSocketContext)
}
