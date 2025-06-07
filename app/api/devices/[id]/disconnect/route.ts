import { type NextRequest, NextResponse } from "next/server"
import { whatsappManager } from "@/lib/whatsapp-client-manager"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // قطع اتصال الجهاز
    const result = await whatsappManager.disconnectDevice(deviceId)

    if (result) {
      return NextResponse.json({
        success: true,
        message: "تم قطع اتصال الجهاز بنجاح",
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "فشل في قطع اتصال الجهاز",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error disconnecting device:", error)
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
