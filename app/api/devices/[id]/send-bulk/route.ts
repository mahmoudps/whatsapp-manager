import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth, buildUnauthorizedResponse } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return buildUnauthorizedResponse(authResult)
    }

    const deviceId = Number.parseInt(id)
    if (isNaN(deviceId)) {
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
    const { recipients, message, delay = 1000 } = body

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "قائمة المستقبلين مطلوبة",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "الرسالة مطلوبة",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // التحقق من وجود الجهاز
    const device = await db.getDeviceById(deviceId)
    if (!device) {
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
      return NextResponse.json(
        {
          success: false,
          error: "الجهاز غير متصل",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // إرسال الرسائل المتعددة
    const results = await whatsappManager.sendBulkMessages(deviceId, recipients, message, delay)

    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return NextResponse.json({
      success: true,
      message: `تم إرسال ${successCount} رسالة بنجاح، فشل في ${failureCount} رسالة`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.error("Error sending bulk messages:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message || "خطأ في الخادم الداخلي",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
