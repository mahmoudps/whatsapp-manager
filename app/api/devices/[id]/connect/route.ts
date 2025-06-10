import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    logger.info(`🔍 POST /api/devices/${id}/connect - Starting request`)

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      logger.info("❌ Authentication failed:", authResult.message)
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(id)
    if (isNaN(deviceId)) {
      logger.info("❌ Invalid device ID:", id)
      return NextResponse.json(
        {
          success: false,
          error: "معرف الجهاز غير صالح",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // Ensure database is initialized
    await db.ensureInitialized()

    logger.info(`📱 Connecting device ID: ${deviceId}`)

    // التحقق من وجود الجهاز
    const device = await db.getDeviceById(deviceId)
    if (!device) {
      logger.info("❌ Device not found:", deviceId)
      return NextResponse.json(
        {
          success: false,
          error: "الجهاز غير موجود",
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      )
    }

    logger.info("✅ Device found:", device.name)

    // التحقق من حالة الجهاز
    if (device.status === "connected" || device.status === "connecting") {
      logger.info("⚠️ Device already connected/connecting")
      return NextResponse.json(
        {
          success: false,
          error: "الجهاز متصل بالفعل أو في حالة اتصال",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // تحديث محاولات الاتصال
    await db.updateDevice(deviceId, {
      connectionAttempts: (device.connectionAttempts || 0) + 1,
      lastConnectionAttempt: new Date().toISOString(),
    })

    // بدء عملية الاتصال
    const success = await whatsappManager.createClient(deviceId, device.name)

    if (success) {
      logger.info("✅ WhatsApp client creation initiated successfully")
      return NextResponse.json({
        success: true,
        message: "تم بدء عملية الاتصال بنجاح",
        deviceId,
        timestamp: new Date().toISOString(),
      })
    } else {
      logger.info("❌ Failed to create WhatsApp client")
      return NextResponse.json(
        {
          success: false,
          error: "فشل في بدء عملية الاتصال",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error(`❌ Error connecting device ${id}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في الاتصال بالجهاز",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
