import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "@/lib/database"

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // التحقق البسيط
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ userId: 1, username }, JWT_SECRET, {
        expiresIn: "24h",
      })

      const response = NextResponse.json({
        success: true,
        message: "تم تسجيل الدخول بنجاح",
      })

      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 86400,
      })

      return response
    }

    // التحقق من وجود قاعدة البيانات
    if (!db) {
      console.error("Database not available")
      return NextResponse.json({ success: false, message: "خطأ في قاعدة البيانات" }, { status: 500 })
    }

    // البحث عن المستخدم
    let admin
    try {
      admin = await db.getAdminByUsername(username)
    } catch (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, message: "خطأ في الوصول إلى قاعدة البيانات" }, { status: 500 })
    }

    if (!admin) {
      console.log("Admin not found:", username)
      return NextResponse.json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 })
    }

    // التحقق من قفل الحساب
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      return NextResponse.json(
        {
          success: false,
          message: "تم قفل الحساب بسبب محاولات تسجيل دخول فاشلة متكررة",
          lockedUntil: admin.lockedUntil,
        },
        { status: 403 },
      )
    }

    // التحقق من كلمة المرور
    let passwordMatch = false
    try {
      passwordMatch = await bcrypt.compare(password, admin.passwordHash)
    } catch (error) {
      console.error("Password comparison error:", error)
      return NextResponse.json({ success: false, message: "خطأ في التحقق من كلمة المرور" }, { status: 500 })
    }

    if (!passwordMatch) {
      // زيادة عدد محاولات تسجيل الدخول الفاشلة
      const maxAttempts = Number.parseInt(process.env.MAX_AUTH_ATTEMPTS || "5")
      const loginAttempts = (admin.loginAttempts || 0) + 1

      let lockedUntil = null
      if (loginAttempts >= maxAttempts) {
        // قفل الحساب لمدة ساعة
        const lockTime = new Date()
        lockTime.setHours(lockTime.getHours() + 1)
        lockedUntil = lockTime.toISOString()
      }

      try {
        await db.updateAdmin(admin.id, {
          loginAttempts,
          lockedUntil,
        })
      } catch (error) {
        console.error("Error updating admin login attempts:", error)
      }

      return NextResponse.json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" }, { status: 401 })
    }

    // إعادة تعيين محاولات تسجيل الدخول الفاشلة
    try {
      await db.updateAdmin(admin.id, {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating admin after successful login:", error)
    }

    // إنشاء رمز JWT
    const jwtSecret = process.env.JWT_SECRET || "default-secret-key-change-in-production"
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h"

    let token
    try {
      token = jwt.sign(
        {
          userId: admin.id,
          username: admin.username,
        },
        jwtSecret,
        { expiresIn: jwtExpiresIn },
      )
    } catch (error) {
      console.error("JWT creation error:", error)
      return NextResponse.json({ success: false, message: "خطأ في إنشاء رمز المصادقة" }, { status: 500 })
    }

    console.log("Login successful for:", username)
    return NextResponse.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: "خطأ في الخادم" }, { status: 500 })
  }
}
