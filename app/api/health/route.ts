export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const check = searchParams.get("check")

    const health: any = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    }

    // فحص قاعدة البيانات إذا طُلب ذلك
    if (check === "database") {
      try {
        await db.ensureInitialized()
        // اختبار بسيط لقاعدة البيانات
        const devices = await db.getAllDevices()
        health.database = {
          connected: true,
          message: "تم الاتصال بقاعدة البيانات بنجاح",
          devicesCount: devices.length,
        }
      } catch (error) {
        logger.error("Database health check failed:", error)
        health.database = {
          connected: false,
          message: `خطأ في قاعدة البيانات: ${error instanceof Error ? error.message : "Unknown error"}`,
        }
      }
    }

    return NextResponse.json(health)
  } catch (error) {
    logger.error("Health check failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "خطأ في فحص الصحة",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
