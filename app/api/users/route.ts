import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth, buildUnauthorizedResponse } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    logger.info("🔍 GET /api/users - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      logger.info("❌ Authentication failed:", authResult.message)
      return buildUnauthorizedResponse(authResult)
    }

    logger.info("✅ Authentication successful")

    // Ensure database is initialized
    await db.ensureInitialized()

    // جلب المستخدمين من قاعدة البيانات
    const admins = await db.getAllAdmins()

    // إخفاء كلمات المرور المشفرة
    const users = admins.map((admin) => ({
      id: admin.id,
      username: admin.username,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
    }))

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("❌ Error in GET /api/users:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب المستخدمين",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
