import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/stats - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("❌ Authentication failed:", authResult.message)
      return NextResponse.json(
        {
          success: false,
          error: authResult.message || "غير مصرح",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    console.log("✅ Authentication successful")

    // جلب إحصائيات النظام
    const devices = await db.getAllDevices()
    const messages = await db.getAllMessages(100, 0)
    const connectedDevices = devices.filter((d) => d.status === "connected").length
    const totalMessages = messages.length
    const successfulMessages = messages.filter((m) => m.status === "sent").length
    const failedMessages = messages.filter((m) => m.status === "failed").length

    // إحصائيات إضافية
    const stats = {
      devices: {
        total: devices.length,
        connected: connectedDevices,
        disconnected: devices.length - connectedDevices,
      },
      messages: {
        total: totalMessages,
        sent: successfulMessages,
        failed: failedMessages,
        pending: totalMessages - successfulMessages - failedMessages,
      },
      system: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in GET /api/stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الإحصائيات",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
