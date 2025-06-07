import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"
import { whatsappManager } from "@/lib/whatsapp-client-manager"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(params.id)
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

    // الحصول على معلومات الجهاز
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

    // الحصول على حالة الاتصال الحالية
    const currentStatus = whatsappManager.getDeviceStatus(deviceId)
    const qrCode = whatsappManager.getDeviceQR(deviceId)

    // إذا كانت حالة الاتصال مختلفة عن قاعدة البيانات، قم بتحديثها
    if (currentStatus !== device.status) {
      await db.updateDevice(deviceId, { status: currentStatus })
      device.status = currentStatus
    }

    // إضافة QR Code إذا كان متاحًا
    if (qrCode && device.status === "qr_ready") {
      device.qrCode = qrCode
    }

    return NextResponse.json({
      success: true,
      device,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting device:", error)
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(params.id)
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

    // التحقق من وجود الجهاز
    const existingDevice = await db.getDeviceById(deviceId)
    if (!existingDevice) {
      return NextResponse.json(
        {
          success: false,
          error: "الجهاز غير موجود",
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      )
    }

    // قراءة البيانات
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "اسم الجهاز مطلوب",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    // تحديث الجهاز
    const updatedDevice = await db.updateDevice(deviceId, { name })

    return NextResponse.json({
      success: true,
      device: updatedDevice,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating device:", error)
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json(authResult, { status: 401 })
    }

    const deviceId = Number.parseInt(params.id)
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

    // قطع اتصال الجهاز إذا كان متصلاً
    if (device.status === "connected" || device.status === "connecting" || device.status === "qr_ready") {
      await whatsappManager.disconnectDevice(deviceId)
    }

    // حذف الجهاز
    const result = await db.deleteDevice(deviceId)

    if (result) {
      return NextResponse.json({
        success: true,
        message: "تم حذف الجهاز بنجاح",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "فشل في حذف الجهاز",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error deleting device:", error)
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
