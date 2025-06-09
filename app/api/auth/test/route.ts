import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  try {
    logger.info("POST /api/auth/test called")

    // اختبار تسجيل الدخول
    const loginResult = await AuthService.login({
      username: "admin",
      password: "admin123!@#",
    })

    if (loginResult.success) {
      // اختبار التحقق من الرمز المميز
      const token = loginResult.token!
      const user = await AuthService.verifyToken(token)

      return NextResponse.json({
        success: true,
        message: "اختبار المصادقة نجح",
        tests: {
          login: "✅ نجح",
          tokenVerification: user ? "✅ نجح" : "❌ فشل",
          userInfo: user,
        },
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "اختبار المصادقة فشل",
        error: loginResult.message,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    logger.error("Error in POST /api/auth/test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في اختبار المصادقة",
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
