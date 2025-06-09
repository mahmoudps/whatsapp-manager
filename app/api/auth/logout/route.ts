import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    logger.info("🔍 POST /api/auth/logout - Starting request")

    // حذف ملف تعريف الارتباط
    const cookieStore = await cookies()
    cookieStore.delete("auth-token")

    return NextResponse.json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("❌ Error in POST /api/auth/logout:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في تسجيل الخروج",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "استخدم طريقة POST لتسجيل الخروج",
    timestamp: new Date().toISOString(),
  })
}
