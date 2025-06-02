import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { db } from "./database"
import { logger } from "@/lib/logger"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"
const MAX_LOGIN_ATTEMPTS = Number.parseInt(process.env.MAX_AUTH_ATTEMPTS || "5")
const LOCK_TIME = 15 * 60 * 1000 // 15 دقيقة
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthUser {
  id: number
  username: string
}

export interface AuthResult {
  success: boolean
  token?: string
  message: string
  user?: {
    id: number
    username: string
  }
}

export interface User {
  id: number
  username: string
  lastLogin?: string
}

export async function validateLogin(credentials: LoginCredentials): Promise<AuthUser | null> {
  try {
    logger.info("🔍 Validating login for:", credentials.username)

    // التحقق من اسم المستخدم
    if (credentials.username !== ADMIN_USERNAME) {
      logger.info("❌ Invalid username")
      return null
    }

    // التحقق من كلمة المرور - استخدام مقارنة مباشرة بدلاً من bcrypt للبيئة الافتراضية
    if (credentials.password !== ADMIN_PASSWORD) {
      logger.info("❌ Invalid password")
      return null
    }

    logger.info("✅ Login successful")
    return {
      id: 1,
      username: ADMIN_USERNAME,
    }
  } catch (error) {
    logger.error("❌ Login validation error:", error)
    return null
  }
}

export function generateAuthToken(user: AuthUser): string {
  try {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    )
  } catch (error) {
    logger.error("Error generating auth token:", error)
    throw new Error("Failed to generate authentication token")
  }
}

export async function authenticateUser(username: string, password: string): Promise<AuthResult> {
  try {
    logger.info("🔐 Authenticating user:", username)

    // للتبسيط، نستخدم التحقق المباشر إذا كانت قاعدة البيانات غير متاحة
    if (!db) {
      logger.warn("Database not available, using direct authentication")
      const user = await validateLogin({ username, password })

      if (!user) {
        return {
          success: false,
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        }
      }

      const token = generateAuthToken(user)

      return {
        success: true,
        token,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          username: user.username,
        },
      }
    }

    // استخدام قاعدة البيانات للتحقق
    try {
      const admin = await db.getAdminByUsername(username)
      logger.info("👤 Admin found:", !!admin)

      if (!admin) {
        logger.info("❌ Admin not found")
        return {
          success: false,
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        }
      }

      if (!admin.isActive) {
        logger.info("❌ Admin not active")
        return {
          success: false,
          message: "الحساب غير مفعل",
        }
      }

      // التحقق من القفل
      if (admin.lockedUntil) {
        const lockTime = new Date(admin.lockedUntil).getTime()
        if (Date.now() < lockTime) {
          const remainingMinutes = Math.ceil((lockTime - Date.now()) / (60 * 1000))
          return {
            success: false,
            message: `الحساب مقفل لمدة ${remainingMinutes} دقيقة`,
          }
        } else {
          // إزالة القفل وإعادة تعيين المحاولات
          await db.updateAdmin(admin.id, {
            loginAttempts: 0,
            lockedUntil: undefined,
          })
        }
      }

      // التحقق من كلمة المرور
      let isValidPassword = false

      try {
        logger.info("🔑 Comparing password...")
        isValidPassword = await bcrypt.compare(password, admin.passwordHash)
      } catch (error) {
        logger.error("Error comparing passwords:", error)
        // إذا فشلت المقارنة، نحاول المقارنة المباشرة (للبيئة الافتراضية)
        isValidPassword = password === ADMIN_PASSWORD && admin.username === ADMIN_USERNAME
      }

      logger.info("✅ Password valid:", isValidPassword)

      if (!isValidPassword) {
        logger.info("❌ Invalid password")

        // زيادة عدد المحاولات الفاشلة
        const newAttempts = admin.loginAttempts + 1
        const updates: any = { loginAttempts: newAttempts }

        // قفل الحساب إذا تجاوز الحد الأقصى
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          updates.lockedUntil = new Date(Date.now() + LOCK_TIME).toISOString()
          logger.info("🔒 Account locked due to too many attempts")
        }

        await db.updateAdmin(admin.id, updates)

        return {
          success: false,
          message:
            newAttempts >= MAX_LOGIN_ATTEMPTS
              ? "تم قفل الحساب بسبب كثرة المحاولات الخاطئة"
              : "اسم المستخدم أو كلمة المرور غير صحيحة",
        }
      }

      // تسجيل دخول ناجح - إعادة تعيين المحاولات
      await db.updateAdmin(admin.id, {
        lastLogin: new Date().toISOString(),
        loginAttempts: 0,
        lockedUntil: undefined,
      })

      // إنشاء JWT token
      const token = jwt.sign(
        {
          userId: admin.id,
          username: admin.username,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      )

      logger.info("✅ Authentication successful")
      return {
        success: true,
        token,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: admin.id,
          username: admin.username,
        },
      }
    } catch (dbError) {
      logger.error("Database error during authentication:", dbError)

      // إذا فشلت قاعدة البيانات، نستخدم التحقق المباشر
      logger.info("Falling back to direct authentication")
      const user = await validateLogin({ username, password })

      if (!user) {
        return {
          success: false,
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        }
      }

      const token = generateAuthToken(user)

      return {
        success: true,
        token,
        message: "تم تسجيل الدخول بنجاح",
        user: {
          id: user.id,
          username: user.username,
        },
      }
    }
  } catch (error) {
    logger.error("❌ Authentication error:", error)
    return {
      success: false,
      message: "خطأ في النظام",
    }
  }
}

export function verifyToken(token: string): { valid: boolean; userId?: number; username?: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      valid: true,
      userId: decoded.userId,
      username: decoded.username,
    }
  } catch (error) {
    logger.error("Token verification error:", error)
    return { valid: false }
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get("auth-token")?.value
    if (!token) return null

    const decoded = verifyToken(token)
    if (!decoded.valid || !decoded.userId) return null

    // للتبسيط، إذا كان المستخدم هو المسؤول الافتراضي
    if (decoded.username === ADMIN_USERNAME) {
      return {
        id: 1,
        username: ADMIN_USERNAME,
      }
    }

    try {
      const admin = await db.getAdminById(decoded.userId)
      if (!admin || !admin.isActive) return null

      return {
        id: admin.id,
        username: admin.username,
        lastLogin: admin.lastLogin,
      }
    } catch (dbError) {
      logger.error("Database error in getCurrentUser:", dbError)
      // إذا فشلت قاعدة البيانات، نعيد المستخدم الافتراضي إذا كان هو المسؤول
      if (decoded.username === ADMIN_USERNAME) {
        return {
          id: 1,
          username: ADMIN_USERNAME,
        }
      }
      return null
    }
  } catch (error) {
    logger.error("❌ Get current user error:", error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<User | null> {
  return await getCurrentUser(request)
}

export class AuthService {
  static async login(credentials: { username: string; password: string }) {
    return await authenticateUser(credentials.username, credentials.password)
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = verifyToken(token)
      if (!decoded.valid || !decoded.userId) return null

      // للتبسيط، إذا كان المستخدم هو المسؤول الافتراضي
      if (decoded.username === ADMIN_USERNAME) {
        return {
          id: 1,
          username: ADMIN_USERNAME,
        }
      }

      try {
        const admin = await db.getAdminById(decoded.userId)
        if (!admin || !admin.isActive) return null

        return {
          id: admin.id,
          username: admin.username,
          lastLogin: admin.lastLogin,
        }
      } catch (dbError) {
        logger.error("Database error in verifyToken:", dbError)
        // إذا فشلت قاعدة البيانات، نعيد المستخدم الافتراضي إذا كان هو المسؤول
        if (decoded.username === ADMIN_USERNAME) {
          return {
            id: 1,
            username: ADMIN_USERNAME,
          }
        }
        return null
      }
    } catch (error) {
      logger.error("Token verification error in service:", error)
      return null
    }
  }

  static async getCurrentUser(request: NextRequest): Promise<User | null> {
    return await getCurrentUser(request)
  }

  static getJwtExpiryInSeconds(): number {
    return 24 * 3600 // 24 ساعة
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      const admin = await db.getAdminById(userId)
      if (!admin) {
        return {
          success: false,
          error: "المستخدم غير موجود",
        }
      }

      const isValidPassword = await bcrypt.compare(currentPassword, admin.passwordHash)
      if (!isValidPassword) {
        return {
          success: false,
          error: "كلمة المرور الحالية غير صحيحة",
        }
      }

      const newPasswordHash = await hashPassword(newPassword)
      await db.updateAdmin(userId, {
        passwordHash: newPasswordHash,
      })

      return {
        success: true,
        message: "تم تغيير كلمة المرور بنجاح",
      }
    } catch (error) {
      logger.error("❌ Change password error:", error)
      return {
        success: false,
        error: "خطأ في الخادم",
      }
    }
  }
}
