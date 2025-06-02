import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"
import { ValidationSchemas } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/devices - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("❌ Authentication failed:", authResult.message)
      return NextResponse.json(
        {
          success: false,
          error: authResult.message || "غير مصرح",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    console.log("✅ Authentication successful")

    // جلب الأجهزة من قاعدة البيانات
    const devices = await db.getAllDevices()
    console.log(`📱 Found ${devices.length} devices`)

    return NextResponse.json({
      success: true,
      devices,
      count: devices.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in GET /api/devices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الأجهزة",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 POST /api/devices - Starting request")

    // التحقق من المصادقة
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      console.log("❌ Authentication failed:", authResult.message)
      return NextResponse.json(
        {
          success: false,
          error: authResult.message || "غير مصرح",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      )
    }

    console.log("✅ Authentication successful")

    // قراءة البيانات
    const body = await request.json()
    console.log("📝 Request body:", body)

    // التحقق من صحة البيانات
    const deviceData = ValidationSchemas.createDevice(body)
    if (!deviceData) {
      console.log("❌ Validation failed for device data")
      return NextResponse.json(
        {
          success: false,
          error: "بيانات الجهاز غير صحيحة - اسم الجهاز مطلوب",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }

    console.log("✅ Validation successful:", deviceData)

    // إنشاء الجهاز في قاعدة البيانات
    try {
      const device = await db.createDevice({
        name: deviceData.name,
        status: "disconnected",
        connectionAttempts: 0,
      })

      if (!device) {
        console.log("❌ Failed to create device in database - device is null")
        return NextResponse.json(
          {
            success: false,
            error: "فشل في إنشاء الجهاز في قاعدة البيانات",
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        )
      }

      console.log("✅ Device created successfully:", device)

      return NextResponse.json(
        {
          success: true,
          device,
          message: "تم إنشاء الجهاز بنجاح",
          timestamp: new Date().toISOString(),
        },
        { status: 201 },
      )
    } catch (dbError) {
      console.error("❌ Database error creating device:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: "خطأ في قاعدة البيانات",
          details: dbError instanceof Error ? dbError.message : "Database error",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("❌ Error in POST /api/devices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في إنشاء الجهاز",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
