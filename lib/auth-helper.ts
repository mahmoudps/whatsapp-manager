import type { NextRequest } from "next/server"
import { logger } from "./logger"
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "./config"

export async function verifyAuth(request: NextRequest) {
  try {
    // محاولة قراءة التوكن من الكوكيز أولاً
    let token = request.cookies.get("auth-token")?.value

    // إذا لم يوجد في الكوكيز، جرب Authorization header
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1]
      }
    }

    if (!token) {
      logger.warn("No token found in cookies or headers")
      return { user: null, error: "No token provided" }
    }

    logger.info("Token found, verifying...")

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (!decoded || !decoded.userId) {
      logger.warn("Invalid token structure:", decoded)
      return { user: null, error: "Invalid token" }
    }

    logger.info("Token verified successfully for user:", decoded.userId)
    return { user: decoded, error: null }
  } catch (error) {
    logger.error("Auth verification failed:", error)
    return { user: null, error: "Authentication failed" }
  }
}
