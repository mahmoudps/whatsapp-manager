import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getUserById } from "@/lib/auth"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "غير مصرح" }, { status: 401 })
    }

    const verification = verifyToken(token)
    if (!verification) {
      return NextResponse.json({ success: false, message: "رمز غير صالح" }, { status: 401 })
    }

    await db.ensureInitialized()
    const user = await getUserById(verification.userId)

    return NextResponse.json({
      success: true,
      user: {
        id: verification.userId,
        username: verification.username,
        lastLogin: user?.lastLogin ?? null,
      },
    })
  } catch (error) {
    logger.error("Auth verification error:", error)
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 })
  }
}
