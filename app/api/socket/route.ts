import type { NextRequest } from "next/server"
import { getWebSocketServer } from "@/lib/websocket-server"

export async function GET(request: NextRequest) {
  try {
    const wsServer = getWebSocketServer()

    if (!wsServer || !wsServer.io) {
      return new Response("WebSocket server not initialized", { status: 500 })
    }

    return new Response("WebSocket server is running", { status: 200 })
  } catch (error) {
    console.error("Error checking WebSocket server:", error)
    return new Response("WebSocket server error", { status: 500 })
  }
}
