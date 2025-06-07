export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"

async function verifyAuth(request: NextRequest) {
  try {
    // محاولة قراءة التوكن من الكوكيز أولاً
    let token = request.cookies.get("auth-token")?.value

    // إذا لم يوجد في الكوكيز، جرب Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      }
    }

    if (!token) {
      logger.warn("No token found in cookies or headers")
      return { user: null, error: "No token provided" }
    }

    logger.info("Token found, verifying...")

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded || !decoded.userId) {
      logger.warn("Invalid token structure:", decoded)
      return { user: null, error: "Invalid token" }
    }

    logger.info("Token verified successfully for user:", decoded.userId)
    return { user: decoded, error: null }
  } catch (error) {
    logger.error("Auth verification failed:", error)
    return { user: null, error: "Authentication failed" }
  }
}

export async function GET(request: NextRequest) {
  try {
    logger.info("🔍 GET /api/stats - Starting request")

    // التحقق من المصادقة
    const { user, error } = await verifyAuth(request)
    if (!user) {
      logger.warn("❌ Authentication failed:", error)
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
