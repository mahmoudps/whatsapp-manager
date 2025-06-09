import type { NextRequest } from "next/server"
import { getWebSocketServer, initializeWebSocketServer } from "@/lib/websocket-server"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    let wsServer = getWebSocketServer()

    // Initialize if not running
    if (!wsServer.isRunning) {
      const port = Number.parseInt(process.env.WEBSOCKET_PORT || "3001")
      wsServer = initializeWebSocketServer(port)
    }

    if (!wsServer || !wsServer.io) {
      return new Response(
        JSON.stringify({
          error: "WebSocket server not initialized",
          status: "failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    return new Response(
      JSON.stringify({
        message: "WebSocket server is running",
        status: "running",
        connections: wsServer.io.engine.clientsCount || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    logger.error("Error checking WebSocket server:", error)
    return new Response(
      JSON.stringify({
        error: "WebSocket server error",
        status: "error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, deviceId, data } = body

    const wsServer = getWebSocketServer()
    if (!wsServer.io) {
      return new Response(JSON.stringify({ error: "WebSocket server not available" }), { status: 503 })
    }

    switch (action) {
      case "broadcast":
        wsServer.io.emit(data.event, data.payload)
        break
      case "device_broadcast":
        if (deviceId) {
          wsServer.io.to(`device_${deviceId}`).emit(data.event, data.payload)
        }
        break
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    logger.error("Error in socket POST:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
}
