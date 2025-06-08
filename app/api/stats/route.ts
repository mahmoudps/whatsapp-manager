export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    logger.info("🔍 GET /api/stats - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success || !authResult.user) {
      logger.warn("❌ Authentication failed:", authResult.message)
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    logger.info("✅ Authentication successful")

    // تأكد من تهيئة قاعدة البيانات
    await db.ensureInitialized()

    // جلب الإحصائيات
    const stats = await db.getStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("❌ Error in GET /api/stats:", error)
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
