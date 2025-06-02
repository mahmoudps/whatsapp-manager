import { NextResponse } from "next/server"
import { getWebSocketServer } from "@/lib/websocket-server"

export async function GET() {
  try {
    const wsServer = getWebSocketServer()

    // تحقق من حالة WebSocket
    const isEnabled = process.env.ENABLE_WEBSOCKET === "true"
    const isRunning = wsServer && wsServer.server && wsServer.io

    // عدد العملاء المتصلين
    let clientCount = 0
    if (isRunning && wsServer.io.sockets) {
      clientCount = Object.keys(wsServer.io.sockets.sockets).length
    }

    // معلومات التكوين
    const config = {
      enabled: isEnabled,
      url: process.env.NEXT_PUBLIC_WEBSOCKET_URL || undefined,
      port: process.env.WEBSOCKET_PORT || undefined,
    }

    return NextResponse.json({
      success: true,
      status: isRunning ? "running" : "stopped",
      message: isRunning
        ? `WebSocket server is running with ${clientCount} connected clients`
        : isEnabled
          ? "WebSocket server is enabled but not running"
          : "WebSocket server is disabled",
      clients: clientCount,
      config,
    })
  } catch (error) {
    console.error("Error checking WebSocket status:", error)
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: `Error checking WebSocket status: ${(error as Error).message}`,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
