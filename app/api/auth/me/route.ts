import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 })
    }

    const verification = verifyToken(token)
    if (!verification.valid) {
      return NextResponse.json({ success: false, message: "رمز غير صالح" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: verification.userId,
        username: verification.username,
      },
    })
  } catch (error) {
    console.error("Auth verification error:", error)
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 })
  }
}
