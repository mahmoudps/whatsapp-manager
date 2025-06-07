import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "كلمة المرور الحالية والجديدة مطلوبتان" }, { status: 400 })
    }

    // الحصول على المستخدم الحالي
    const user = await AuthService.getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "غير مصرح به" }, { status: 401 })
    }

    // تغيير كلمة المرور
    const result = await AuthService.changePassword(user.id, currentPassword, newPassword)

    if (result.success) {
      logger.info(`Password changed successfully for user: ${user.username}`)
      return NextResponse.json({
        success: true,
        message: "تم تغيير كلمة المرور بنجاح",
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    logger.error("Change password API error:", error)
    return NextResponse.json({ success: false, error: "خطأ داخلي في الخادم" }, { status: 500 })
  }
}
