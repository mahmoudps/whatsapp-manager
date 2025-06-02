import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/messages - Starting request")

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

    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "100")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")
    const deviceId = url.searchParams.get("deviceId")

    console.log(`📝 Fetching messages - limit: ${limit}, offset: ${offset}, deviceId: ${deviceId}`)

    let messages
    if (deviceId) {
      messages = await db.getMessagesByDevice(Number.parseInt(deviceId), limit)
    } else {
      messages = await db.getAllMessages(limit, offset)
    }

    console.log(`📨 Found ${messages.length} messages`)

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in GET /api/messages:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الرسائل",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
