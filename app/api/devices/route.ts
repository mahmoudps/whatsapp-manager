export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    logger.info("🔍 GET /api/devices - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      logger.warn("❌ Authentication failed:", authResult.message)
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    logger.info("✅ Authentication successful")

    // تأكد من تهيئة قاعدة البيانات
    await db.ensureInitialized()

    // جلب جميع الأجهزة
    const devices = await db.getAllDevices()

    logger.info(`📱 Found ${devices.length} devices`)

    return NextResponse.json({
      success: true,
      devices,
      count: devices.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("❌ Error in GET /api/devices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الأجهزة",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info("📝 POST /api/devices - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      logger.warn("❌ Authentication failed:", authResult.message)
      return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 })
    }

    logger.info("✅ Authentication successful")

    const { name } = await request.json()

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "اسم الجهاز مطلوب" }, { status: 400 })
    }

    // تأكد من تهيئة قاعدة البيانات
    await db.ensureInitialized()

    // إنشاء جهاز جديد
    const device = await db.createDevice({
      name: name.trim(),
      status: "disconnected",
    })

    logger.info(`✅ Device created: ${device.name}`)

    return NextResponse.json(
      {
        success: true,
        device,
        message: "تم إنشاء الجهاز بنجاح",
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch (error) {
    logger.error("❌ Error in POST /api/devices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في إنشاء الجهاز",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
