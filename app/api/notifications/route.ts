import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/middleware"

// مخزن مؤقت للإشعارات (في الإنتاج يجب استخدام قاعدة بيانات)
const notifications = [
  {
    id: "1",
    title: "تم تسجيل الدخول",
    message: "تم تسجيل الدخول بنجاح إلى النظام",
    type: "info",
    read: false,
    timestamp: new Date().toISOString(),
  },
  {
    id: "2",
    title: "جهاز جديد متصل",
    message: "تم توصيل جهاز واتساب جديد بنجاح",
    type: "success",
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    title: "تحديث النظام",
    message: "يتوفر تحديث جديد للنظام",
    type: "warning",
    read: true,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
]

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/notifications - Starting request")

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

    // معالجة المعلمات
    const url = new URL(request.url)
    const unreadOnly = url.searchParams.get("unread") === "true"

    // تصفية الإشعارات حسب الحاجة
    const filteredNotifications = unreadOnly ? notifications.filter((n) => !n.read) : notifications

    return NextResponse.json({
      success: true,
      notifications: filteredNotifications,
      count: filteredNotifications.length,
      unreadCount: notifications.filter((n) => !n.read).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in GET /api/notifications:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في جلب الإشعارات",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 POST /api/notifications - Starting request")

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

    // تحديث حالة القراءة
    if (body.action === "markAsRead" && body.id) {
      const notification = notifications.find((n) => n.id === body.id)
      if (notification) {
        notification.read = true
      }
    } else if (body.action === "markAllAsRead") {
      notifications.forEach((n) => (n.read = true))
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث الإشعارات بنجاح",
      unreadCount: notifications.filter((n) => !n.read).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in POST /api/notifications:", error)
    return NextResponse.json(
      {
        success: false,
        error: "خطأ في تحديث الإشعارات",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
