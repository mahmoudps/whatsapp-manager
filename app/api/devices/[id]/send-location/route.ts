export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { ValidationSchemas } from "@/lib/validation"
import { logger } from "@/lib/logger"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(id)
    if (isNaN(deviceId)) {
      return NextResponse.json(
        { success: false, error: "معرف الجهاز غير صالح", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    await db.ensureInitialized()

    const body = await request.json()
    const data = ValidationSchemas.locationMessage(body)

    if (!data) {
      return NextResponse.json(
        { success: false, error: "بيانات غير صالحة", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    const device = await db.getDeviceById(deviceId)
    if (!device) {
      return NextResponse.json(
        { success: false, error: "الجهاز غير موجود", timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    if (!whatsappManager.isClientReady(deviceId)) {
      return NextResponse.json(
        { success: false, error: "الجهاز غير متصل", timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    const success = await whatsappManager.sendLocationMessage(
      deviceId,
      data.recipient,
      data.latitude,
      data.longitude,
      data.description,
    )

    if (success) {
      return NextResponse.json({ success: true, message: "تم الإرسال", timestamp: new Date().toISOString() })
    }

    return NextResponse.json(
      { success: false, error: "فشل الإرسال", timestamp: new Date().toISOString() },
      { status: 500 },
    )
  } catch (error) {
    logger.error("Error sending location message:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في الخادم",
        details: error instanceof Error ? error.message : "Unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
