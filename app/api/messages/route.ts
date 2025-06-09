export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    logger.info("🔍 GET /api/messages - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      logger.warn("❌ Authentication failed:", authResult.message)
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    logger.info("✅ Authentication successful")

    // قراءة المعاملات
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const deviceId = searchParams.get("deviceId")
    const recipient = searchParams.get("recipient") || undefined
    const isGroupParam = searchParams.get("isGroup")
    const isGroup =
      isGroupParam === "true" ? true : isGroupParam === "false" ? false : undefined

    logger.info(`📝 Fetching messages - limit: ${limit}, offset: ${offset}, deviceId: ${deviceId}`)

    // تأكد من تهيئة قاعدة البيانات
    await db.ensureInitialized()

    // جلب الرسائل
    let messages = await db.getMessages({
      deviceId: deviceId ? Number.parseInt(deviceId) : undefined,
      recipient: recipient || undefined,
      isGroup,
      limit,
      offset,
    })

    logger.info(`📨 Found ${messages.length} messages`)

    return NextResponse.json({
      success: true,
      data: messages,
      count: messages.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("❌ Error in GET /api/messages:", error)
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
