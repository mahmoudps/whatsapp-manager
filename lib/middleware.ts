import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { db } from "./database"
import { JWT_SECRET, JWT_EXPIRES_IN } from "@/lib/config"

export async function verifyAuth(request: NextRequest) {
  try {
    console.log("🔍 Verifying authentication")

    // الحصول على التوكن من الكوكيز أو الهيدر
    const token =
      request.cookies.get("auth-token")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "") ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      console.log("❌ No token provided")
      return {
        success: false,
        message: "توكن غير صالح",
      }
    }

    // التحقق من صحة التوكن
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      console.log("✅ Token verified successfully")

      // التحقق من وجود المستخدم في قاعدة البيانات
      const admin = await db.getAdminById(decoded.userId)
      if (!admin || !admin.isActive) {
        console.log("❌ User not found or inactive")
        return {
          success: false,
          message: "المستخدم غير موجود أو غير مفعل",
        }
      }

      return {
        success: true,
        user: {
          id: decoded.userId,
          username: decoded.username,
        },
      }
    } catch (jwtError) {
      console.error("❌ JWT verification error:", jwtError)
      return {
        success: false,
        message: "توكن غير صالح",
      }
    }
  } catch (error) {
    console.error("❌ Authentication verification error:", error)
    return {
      success: false,
      message: "خطأ في التحقق من المصادقة",
    }
  }
}

export function createAuthToken(user: { id: number; username: string }) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}
