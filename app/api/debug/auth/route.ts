import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  try {
    // فحص المستخدم في قاعدة البيانات
    const user = db.getUserByUsername("admin")

    if (!user) {
      return NextResponse.json({
        error: "Admin not found in database",
        admins: Array.from((db as any).admins?.values() || []),
      })
    }

    // اختبار كلمة المرور
    const testPasswords = ["admin123", "password", "admin"]
    const results = []

    for (const pwd of testPasswords) {
      const isValid = await bcrypt.compare(pwd, user.password)
      results.push({
        password: pwd,
        isValid,
        hash: user.password,
      })
    }

    return NextResponse.json({
      admin: {
        id: user.id,
        username: user.username,
        passwordHash: user.password,
      },
      passwordTests: results,
      bcryptWorking: await bcrypt.compare("test", await bcrypt.hash("test", 12)),
    })
  } catch (error) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    })
  }
}
