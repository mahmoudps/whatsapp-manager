import { getWebSocketServer } from "./websocket-server"

// Add function to get WebSocket instance
export function getWebSocketInstance() {
  try {
    const wsServer = getWebSocketServer()
    return wsServer?.io || null
  } catch (error) {
    console.error("Failed to get WebSocket instance:", error)
    return null
  }
}

// Add function to emit events
export function emitWebSocketEvent(event: string, data: any) {
  try {
    const io = getWebSocketInstance()
    if (io) {
      io.emit(event, data)
    }
  } catch (error) {
    console.error("Failed to emit WebSocket event:", error)
  }
}
