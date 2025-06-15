import { type NextRequest, NextResponse } from "next/server"
type AppRouteHandlerFnContext = any
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { ValidationSchemas } from "@/lib/validation"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  ctx: AppRouteHandlerFnContext,
) {
  const { id } = (ctx?.params ? await ctx.params : undefined) ?? undefined
  try {
    logger.info(`🔍 POST /api/devices/${id}/send - Starting request`)

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

    // قراءة البيانات
    const body = await request.json()
    logger.info("📝 Request body:", body)

    // التحقق من صحة البيانات
    const messageData = ValidationSchemas.message({
      to: body.recipient,
      message: body.message,
    })

    if (!messageData) {
      logger.info("❌ Message validation failed")
      return NextResponse.json(
        {
          success: false,
          error: "بيانات الرسالة غير صحيحة",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    logger.info("✅ Message validation successful")

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

    // التحقق من حالة الاتصال
    if (!whatsappManager.isClientReady(deviceId)) {
      logger.info("❌ Device not connected:", deviceId)
      return NextResponse.json(
        {
          success: false,
          error: "الجهاز غير متصل",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    logger.info(`📤 Sending message from device ${deviceId} to ${messageData.to}`)

    // إرسال الرسالة
    const success = await whatsappManager.sendMessage(deviceId, messageData.to, messageData.message)

    if (success) {
      logger.info("✅ Message sent successfully")
      return NextResponse.json({
        success: true,
        message: "تم إرسال الرسالة بنجاح",
        timestamp: new Date().toISOString(),
      })
    } else {
      logger.info("❌ Failed to send message")
      return NextResponse.json(
        {
          success: false,
          error: "فشل في إرسال الرسالة",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    logger.error(`❌ Error sending message from device ${id}:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في إرسال الرسالة",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
