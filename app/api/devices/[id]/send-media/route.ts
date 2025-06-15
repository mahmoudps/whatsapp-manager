export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import type { RouteHandlerContext } from "next"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/auth"
import { ValidationSchemas } from "@/lib/validation"
import fs from "fs/promises"
import path from "path"

export async function POST(
  request: NextRequest,
  { params }: RouteHandlerContext<{ id: string }>,
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

    const form = await request.formData()
    const file = form.get("file") as File | null
    const recipient = form.get("recipient") as string | null
    const caption = (form.get("caption") as string | null) || ""

    if (!file || !recipient) {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة", timestamp: new Date().toISOString() }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const mimeType = file.type

    const uploadsDir = path.join(process.cwd(), "uploads")
    await fs.mkdir(uploadsDir, { recursive: true })
    const filePath = path.join(uploadsDir, `${Date.now()}-${file.name}`)
    await fs.writeFile(filePath, buffer)

    const data = ValidationSchemas.mediaMessage({
      recipient,
      data: buffer.toString("base64"),
      mimeType,
      caption,
    })

    if (!data) {
      return NextResponse.json({ success: false, error: "بيانات غير صالحة", timestamp: new Date().toISOString() }, { status: 400 })
    }

    const device = await db.getDeviceById(deviceId)
    if (!device) {
      return NextResponse.json({ success: false, error: "الجهاز غير موجود", timestamp: new Date().toISOString() }, { status: 404 })
    }

    if (!whatsappManager.isClientReady(deviceId)) {
      return NextResponse.json({ success: false, error: "الجهاز غير متصل", timestamp: new Date().toISOString() }, { status: 400 })
    }

    const success = await whatsappManager.sendMediaMessage(deviceId, data.recipient, data.data, data.mimeType, data.caption)

    if (success) {
      return NextResponse.json({ success: true, message: "تم الإرسال", timestamp: new Date().toISOString() })
    }

    return NextResponse.json({ success: false, error: "فشل الإرسال" , timestamp: new Date().toISOString() }, { status: 500 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "خطأ في الخادم", details: error instanceof Error ? error.message : "Unknown" , timestamp: new Date().toISOString() }, { status: 500 })
  }
}
