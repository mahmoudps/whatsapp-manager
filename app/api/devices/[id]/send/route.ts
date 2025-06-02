import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"
import { ValidationSchemas } from "@/lib/validation"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🔍 POST /api/devices/${params.id}/send - Starting request`)

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("❌ Authentication failed:", authResult.message)
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(params.id)
    if (isNaN(deviceId)) {
      console.log("❌ Invalid device ID:", params.id)
      return NextResponse.json(
        {
          success: false,
          error: "معرف الجهاز غير صالح",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // قراءة البيانات
    const body = await request.json()
    console.log("📝 Request body:", body)

    // التحقق من صحة البيانات
    const messageData = ValidationSchemas.createMessage({
      deviceId,
      recipient: body.recipient,
      message: body.message,
    })

    if (!messageData) {
      console.log("❌ Message validation failed")
      return NextResponse.json(
        {
          success: false,
          error: "بيانات الرسالة غير صحيحة",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    console.log("✅ Message validation successful")

    // التحقق من وجود الجهاز
    const device = await db.getDeviceById(deviceId)
    if (!device) {
      console.log("❌ Device not found:", deviceId)
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
      console.log("❌ Device not connected:", deviceId)
      return NextResponse.json(
        {
          success: false,
          error: "الجهاز غير متصل",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    console.log(`📤 Sending message from device ${deviceId} to ${messageData.recipient}`)

    // إرسال الرسالة
    const success = await whatsappManager.sendMessage(deviceId, messageData.recipient, messageData.message)

    if (success) {
      console.log("✅ Message sent successfully")
      return NextResponse.json({
        success: true,
        message: "تم إرسال الرسالة بنجاح",
        timestamp: new Date().toISOString(),
      })
    } else {
      console.log("❌ Failed to send message")
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
    console.error(`❌ Error sending message from device ${params.id}:`, error)
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
