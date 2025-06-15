export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { ValidationSchemas } from "@/lib/validation"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(id)
    if (isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "معرف الجهاز غير صالح", timestamp: new Date().toISOString() }, { status: 400 })
    }

    // Ensure database is initialized
    await db.ensureInitialized()

    const body = await request.json()
    const data = ValidationSchemas.scheduledMessage(body)

    if (!data) {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة", timestamp: new Date().toISOString() }, { status: 400 })
    }

    const device = await db.getDeviceById(deviceId)
    if (!device) {
      return NextResponse.json({ success: false, error: "الجهاز غير موجود", timestamp: new Date().toISOString() }, { status: 404 })
    }

    await db.createMessage({
      deviceId,
      recipient: data.recipient,
      message: data.message,
      status: "scheduled",
      scheduledAt: data.sendAt,
      messageType: "text",
    })

    return NextResponse.json({ success: true, message: "تمت جدولة الرسالة", timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ success: false, error: "خطأ في الخادم", details: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
