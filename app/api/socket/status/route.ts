export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { getDefaultWebSocketUrl } from "@/lib/utils"

export async function GET() {
  try {
    const isWebSocketEnabled =
      (process.env.ENABLE_WEBSOCKET || "")
        .trim()
        .toLowerCase() === "true"
    const websocketPort = process.env.WEBSOCKET_PORT || "3001"
    const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || getDefaultWebSocketUrl()
    let healthUrl: string
    if (process.env.NEXT_PUBLIC_WEBSOCKET_URL) {
      try {
        const parsed = new URL(process.env.NEXT_PUBLIC_WEBSOCKET_URL)
        const protocol = parsed.protocol.startsWith("wss") ? "https" : "http"
        healthUrl = `${protocol}://${parsed.host}/health`
      } catch {
        healthUrl = `http://localhost:${websocketPort}/health`
      }
    } else {
      healthUrl = `http://localhost:${websocketPort}/health`
    }

    if (!isWebSocketEnabled) {
      return NextResponse.json({
        success: false,
        status: "disabled",
        message: "WebSocket server is disabled",
        clients: 0,
        config: {
          enabled: false,
          url: websocketUrl,
          port: websocketPort,
        },
      })
    }

    // محاولة التحقق من حالة خادم WebSocket عبر طلب صحة HTTP
    try {
      const healthResponse = await fetch(healthUrl)

      if (!healthResponse.ok) {
        const text = await healthResponse.text()
        return NextResponse.json({
          success: false,
          status: "error",
          message: `WebSocket server responded with ${healthResponse.status}: ${text}`,
          clients: 0,
          config: {
            enabled: true,
            url: websocketUrl,
            port: websocketPort,
          },
        })
      }

      const data = await healthResponse.json().catch(() => ({}))
      const clients = data.stats?.socketIOConnections || data.connections || 0

      return NextResponse.json({
        success: true,
        status: "running",
        message: "WebSocket server is running",
        clients,
        config: {
          enabled: true,
          url: websocketUrl,
          port: websocketPort,
        },
      })
    } catch (error) {
      return NextResponse.json({
        success: false,
        status: "error",
        message: `WebSocket server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        clients: 0,
        config: {
          enabled: true,
          url: websocketUrl,
          port: websocketPort,
        },
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: "error",
        message: "خطأ في فحص حالة WebSocket",
      },
      { status: 500 },
    )
  }
}
