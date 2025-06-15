export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth, buildUnauthorizedResponse } from "@/lib/auth"
import { ValidationSchemas } from "@/lib/validation"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return buildUnauthorizedResponse(authResult)
    }

    const deviceId = Number.parseInt(id)
    if (isNaN(deviceId)) {
      return NextResponse.json({ success: false, error: "معرف الجهاز غير صالح", timestamp: new Date().toISOString() }, { status: 400 })
    }

    await db.ensureInitialized()

    const body = await request.json()
    const data = ValidationSchemas.scheduledBulkMessage(body)

    if (!data) {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة", timestamp: new Date().toISOString() }, { status: 400 })
    }

    const device = await db.getDeviceById(deviceId)
    if (!device) {
      return NextResponse.json({ success: false, error: "الجهاز غير موجود", timestamp: new Date().toISOString() }, { status: 404 })
    }

    for (const recipient of data.recipients) {
      await db.createMessage({
        deviceId,
        recipient,
        message: data.message,
        status: "scheduled",
        scheduledAt: data.sendAt,
        messageType: "text",
      })
    }

    return NextResponse.json({ success: true, message: "تمت جدولة الرسائل", count: data.recipients.length, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ success: false, error: "خطأ في الخادم", details: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
