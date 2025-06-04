import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/database"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }
  try {
    // فحص المدير في قاعدة البيانات
    const admin = db.getAdminByUsername("admin")

    if (!admin) {
      return NextResponse.json({
        error: "Admin not found in database",
        admins: Array.from((db as any).admins?.values() || []),
      })
    }

    // اختبار كلمة المرور
    const testPasswords = ["admin123", "password", "admin"]
    const results = []

    for (const pwd of testPasswords) {
      const isValid = await bcrypt.compare(pwd, admin.passwordHash)
      results.push({
        password: pwd,
        isValid,
        hash: admin.passwordHash,
      })
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        username: admin.username,
        isActive: admin.isActive,
        passwordHash: admin.passwordHash,
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
