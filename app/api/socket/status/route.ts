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

    // محاولة التحقق من حالة WebSocket server
    try {
      // هنا يمكن إضافة فحص فعلي للWebSocket server
      // لكن الآن سنعتبره متاح إذا كان مُفعل
      return NextResponse.json({
        success: true,
        status: "running",
        message: "WebSocket server is running",
        clients: 0, // يمكن تحديث هذا لاحقاً
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
