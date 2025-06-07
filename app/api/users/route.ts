import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { verifyAuth } from "@/lib/middleware"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/users - Starting request")

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

    // جلب المستخدمين من قاعدة البيانات
    const admins = await db.getAllAdmins()

    // إخفاء كلمات المرور المشفرة
    const users = admins.map((admin) => ({
      id: admin.id,
      username: admin.username,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      createdAt: admin.createdAt,
    }))

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in GET /api/users:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب المستخدمين",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
