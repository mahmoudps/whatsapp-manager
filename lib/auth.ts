import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { logger } from "./logger"
import { db } from "./database"
import {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} from "./config"

export interface User {
  id: number
  username: string
  password?: string
  role?: string
  createdAt?: string
  lastLogin?: string
}

export interface TokenPayload {
  userId: number
  username: string
  role?: string
  exp?: number
  iat?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  userId: number
  username: string
  role: string
}

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
      return { success: false, message: "No token provided" }
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser

    if (!decoded || !decoded.userId) {
      logger.warn("Invalid token structure:", decoded)
      return { success: false, message: "Invalid token" }
    }

    logger.info("Token verified successfully for user:", decoded.userId)
    const { userId, username, role } = decoded
    return { success: true, user: { userId, username, role } }
  } catch (error: any) {
    logger.error("Auth verification failed:", error)
    if (error.name === "JsonWebTokenError") {
      return { success: false, message: "Invalid token" }
    }
    return { success: false, message: "Authentication failed" }
  }
}

export async function generateTokens(user: { id: number; username: string; role?: string }) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role || "user",
  }

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })

  // حساب تاريخ انتهاء الصلاحية
  const refreshExpires = new Date()
  refreshExpires.setDate(refreshExpires.getDate() + 7) // 7 days

  // حفظ refresh token في قاعدة البيانات إذا كانت متاحة
  if (db && typeof (db as any).createRefreshToken === "function") {
    try {
      await (db as any).createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpires.toISOString(),
      })
    } catch (error) {
      logger.error("Failed to store refresh token", { error })
    }
  }

  return { accessToken, refreshToken }
}

export function verifyToken(token: string): { valid: boolean } & Partial<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return { valid: true, ...decoded }
  } catch (error) {
    logger.error("Token verification failed", { error })
    return { valid: false }
  }
}

export async function validateRefreshToken(token: string): Promise<boolean> {
  try {
    // Verify token format
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload

    // Check if token exists in database
    const stmt = db.connection.prepare("SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0")
    const result = stmt.get(token)

    if (!result) {
      logger.warn("Refresh token not found in database or revoked", { userId: decoded.userId })
      return false
    }

    // Check if token is expired
    const expiresAt = new Date(result.expires_at)
    if (expiresAt < new Date()) {
      logger.warn("Refresh token expired", { userId: decoded.userId })
      return false
    }

    return true
  } catch (error) {
    logger.error("Refresh token validation failed", { error })
    return false
  }
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    const stmt = db.connection.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?")
    const result = stmt.run(token)
    return result.changes > 0
  } catch (error) {
    logger.error("Failed to revoke refresh token", { error })
    return false
  }
}

export async function revokeAllUserTokens(userId: number): Promise<boolean> {
  try {
    const stmt = db.connection.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?")
    const result = stmt.run(userId)
    return result.changes > 0
  } catch (error) {
    logger.error("Failed to revoke all user tokens", { error, userId })
    return false
  }
}

export async function getUserById(userId: number): Promise<User | null> {
  try {
    if (db && typeof (db as any).ensureInitialized === "function") {
      try {
        await (db as any).ensureInitialized()
        const stmt = db.connection.prepare("SELECT id, username, role, created_at, last_login FROM users WHERE id = ?")
        const user = stmt.get(userId) as User | undefined
        return user || null
      } catch {}
    }
    return null
  } catch (error) {
    logger.error("Failed to get user by ID", { error, userId })
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    if (db && typeof (db as any).ensureInitialized === "function") {
      try {
        await (db as any).ensureInitialized()
        const stmt = db.connection.prepare("SELECT * FROM users WHERE username = ?")
        const user = stmt.get(username) as User | undefined
        return user || null
      } catch {}
    }
    return null
  } catch (error) {
    logger.error("Failed to get user by username", { error, username })
    return null
  }
}

export async function validateUserCredentials(username: string, password: string): Promise<User | null> {
  try {
    if (db && typeof (db as any).ensureInitialized === "function") {
      try {
        await (db as any).ensureInitialized()
      } catch {}
      const user = await getUserByUsername(username)
      if (!user || !user.password) {
        return null
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return null
      }

      const updateStmt = db.connection.prepare("UPDATE users SET last_login = ? WHERE id = ?")
      updateStmt.run(new Date().toISOString(), user.id)

      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      return { id: 1, username: ADMIN_USERNAME, role: "admin" }
    }

    return null
  } catch (error) {
    logger.error("Failed to validate user credentials", { error, username })
    return null
  }
}

export async function createUser(username: string, password: string, role = "user"): Promise<User | null> {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const stmt = db.connection.prepare(
      "INSERT INTO users (username, password, role, created_at, last_login) VALUES (?, ?, ?, ?, ?)",
    )
    const now = new Date().toISOString()
    const result = stmt.run(username, hashedPassword, role, now, now)

    if (result.lastInsertRowid) {
      return {
        id: Number(result.lastInsertRowid),
        username,
        role,
        createdAt: now,
        lastLogin: now,
      }
    }
    return null
  } catch (error) {
    logger.error("Failed to create user", { error, username })
    return null
  }
}

export async function changePassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const stmt = db.connection.prepare("UPDATE users SET password = ? WHERE id = ?")
    const result = stmt.run(hashedPassword, userId)
    return result.changes > 0
  } catch (error) {
    logger.error("Failed to change password", { error, userId })
    return false
  }
}

export async function validatePassword(plainPassword: string, hashedPassword: string) {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

// إضافة دالة verifyAuth المفقودة

// إضافة AuthService class
export class AuthService {
  static async login(credentials: { username: string; password: string }) {
    const result = await validateUserCredentials(credentials.username, credentials.password)
    if (result) {
      const tokens = await generateTokens(result)
      return {
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: result,
        message: "تم تسجيل الدخول بنجاح",
      }
    }
    return {
      success: false,
      message: "اسم المستخدم أو كلمة المرور غير صحيحة",
    }
  }

  static async verifyToken(token: string) {
    const decoded = verifyToken(token)
    if (!decoded.valid || decoded.userId === undefined) return null

    const user = await getUserById(decoded.userId)
    return user
  }

  static async getCurrentUser(request: NextRequest) {
    const authResult = await verifyAuth(request)
    return authResult.user || null
  }

  static async refreshAccessToken(refreshToken: string) {
    const isValid = await validateRefreshToken(refreshToken)
    if (!isValid) return null

    const decoded = verifyToken(refreshToken)
    if (!decoded.valid || decoded.userId === undefined) return null

    const user = await getUserById(decoded.userId)
    if (!user) return null

    const tokens = await generateTokens(user)
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  }

  static async changePassword(userId: number, currentPassword: string, newPassword: string) {
    try {
      const user = await getUserById(userId)
      if (!user) {
        return { success: false, error: "المستخدم غير موجود" }
      }

      // التحقق من كلمة المرور الحالية
      const fullUser = await getUserByUsername(user.username)
      if (!fullUser || !fullUser.password) {
        return { success: false, error: "خطأ في البيانات" }
      }

      const isValidPassword = await bcrypt.compare(currentPassword, fullUser.password)
      if (!isValidPassword) {
        return { success: false, error: "كلمة المرور الحالية غير صحيحة" }
      }

      const success = await changePassword(userId, newPassword)
      if (success) {
        return { success: true, message: "تم تغيير كلمة المرور بنجاح" }
      } else {
        return { success: false, error: "فشل في تغيير كلمة المرور" }
      }
    } catch (error) {
      logger.error("Change password error:", error)
      return { success: false, error: "خطأ في الخادم" }
    }
  }
}

// ---------------------------------------------------------------------------
// Compatibility wrappers for legacy tests
// ---------------------------------------------------------------------------

export async function validateLogin(credentials: { username: string; password: string }) {
  const user = await validateUserCredentials(credentials.username, credentials.password)
  if (!user) return null
  return { id: user.id, username: user.username }
}

export function generateAuthToken(user: { id: number; username: string }) {
  return jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export async function authenticateUser(username: string, password: string) {
  const user = await validateUserCredentials(username, password)
  if (!user) return { success: false }

  const tokens = await generateTokens(user)
  return {
    success: true,
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  }
}
