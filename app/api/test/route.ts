import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    logger.info("GET /api/test called")

    // اختبار قاعدة البيانات
    let dbTest = "❌ فشل"
    try {
      const { db } = await import("@/lib/database")
      const devices = db.getDevices()
      dbTest = `✅ نجح (${devices.length} أجهزة)`
    } catch (error) {
      dbTest = `❌ خطأ: ${(error as Error).message}`
    }

    // اختبار المصادقة
    let authTest = "❌ فشل"
    try {
      const { AuthService } = await import("@/lib/auth")
      const result = await AuthService.login({ username: "admin", password: "admin123!@#" })
      authTest = result.success ? "✅ نجح" : `❌ فشل: ${result.error}`
    } catch (error) {
      authTest = `❌ خطأ: ${(error as Error).message}`
    }

    // اختبار متغيرات البيئة
    const envTest = {
      JWT_SECRET: process.env.JWT_SECRET ? "✅ موجود" : "❌ مفقود",
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ? "✅ موجود" : "❌ مفقود",
      DATABASE_PATH: process.env.DATABASE_PATH ? "✅ موجود" : "❌ مفقود",
      ADMIN_USERNAME: process.env.ADMIN_USERNAME ? "✅ موجود" : "❌ مفقود",
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? "✅ موجود" : "❌ مفقود",
    }

    return NextResponse.json({
      success: true,
      message: "اختبار شامل للنظام",
      tests: {
        database: dbTest,
        authentication: authTest,
        environment: envTest,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: `${Math.floor(process.uptime())} ثانية`,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error in GET /api/test:", error)
    return NextResponse.json(
      {
        success: false,
        error: "فشل في اختبار النظام",
        details: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
