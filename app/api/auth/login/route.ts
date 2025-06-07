export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "@/lib/database"
import { logger } from "@/lib/logger"

// استخدام نفس JWT_SECRET في جميع الملفات
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    logger.info("Login attempt", { username })

    // التحقق البسيط للمستخدم الافتراضي
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        {
          userId: 1,
          username,
          role: "admin",
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        },
      )

      logger.info("Login successful (default admin)", { username })

      const response = NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        token,
        user: {
          id: 1,
          username,
          role: "admin",
        },
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400, // 24 hours
      })

      return response
    }

    // التحقق من قاعدة البيانات
    if (!db) {
      logger.error("Database not available")
      return NextResponse.json(
        {
          success: false,
          message: "خطأ في قاعدة البيانات",
        },
        { status: 500 },
      )
    }

    // البحث عن المستخدم في قاعدة البيانات
    let user
    try {
      // تأكد من تهيئة قاعدة البيانات
      await db.ensureInitialized()
      user = db.getUserByUsername(username)
    } catch (error) {
      logger.error("Database error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "خطأ في الوصول إلى قاعدة البيانات",
        },
        { status: 500 },
      )
    }

    if (!user) {
      logger.warn("User not found", { username })
      return NextResponse.json(
        {
          success: false,
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        },
        { status: 401 },
      )
    }

    // التحقق من كلمة المرور
    let passwordMatch = false
    try {
      passwordMatch = await bcrypt.compare(password, user.password)
    } catch (error) {
      logger.error("Password comparison error:", error)
      return NextResponse.json(
        {
          success: false,
          message: "خطأ في التحقق من كلمة المرور",
        },
        { status: 500 },
      )
    }

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "اسم المستخدم أو كلمة المرور غير صحيحة",
        },
        { status: 401 },
      )
    }

    // تحديث آخر تسجيل دخول
    try {
      db.updateUserLastLogin(user.id)
    } catch (error) {
      logger.error("Error updating user after successful login:", error)
    }

    // إنشاء رمز JWT باستخدام نفس السر المستخدم في التحقق
    let token
    try {
      token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      )
    }

    logger.info("Login successful", { username })

    const response = NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })

    // حفظ التوكن في الكوكيز
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    })

    return response
  } catch (error) {
    logger.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "خطأ في الخادم",
      },
      { status: 500 },
    )
  }
}
