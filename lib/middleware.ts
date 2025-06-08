import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { logger } from "./logger"
import { JWT_SECRET, JWT_EXPIRES_IN } from "./config"

interface AuthResult {
  success: boolean
  message?: string
  user?: any
}

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // استخراج التوكن من الكوكيز
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return {
        success: false,
        message: "لا يوجد رمز مصادقة",
      }
    }

    // التحقق من صحة التوكن
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any

      return {
        success: true,
        user: {
          id: decoded.userId,
          username: decoded.username,
        },
      }
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError)
      return {
        success: false,
        message: "رمز مصادقة غير صالح",
      }
    }
  } catch (error) {
    logger.error("Auth verification error:", error)
    return {
      success: false,
      message: "خطأ في التحقق من المصادقة",
    }
  }
}

export function createAuthToken(payload: { id: number; username: string }) {
  return jwt.sign(
    {
      userId: payload.id,
      username: payload.username,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}
