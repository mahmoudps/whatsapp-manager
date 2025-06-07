#!/usr/bin/env node

/**
 * سكريبت لإعادة تعيين JWT Secret
 * يقوم بإنشاء مفتاح جديد وتحديث ملف .env
 */

const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// إنشاء JWT secret جديد
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString("hex")
}

// تحديث ملف .env
function updateEnvFile(newSecret) {
  const envPath = path.join(process.cwd(), ".env")

  try {
    // التحقق من وجود الملف
    if (!fs.existsSync(envPath)) {
      console.log("📄 ملف .env غير موجود. سيتم إنشاؤه.")
      fs.writeFileSync(envPath, `JWT_SECRET=${newSecret}\n`)
      return true
    }

    // قراءة الملف الحالي
    let envContent = fs.readFileSync(envPath, "utf8")

    // التحقق مما إذا كان JWT_SECRET موجوداً بالفعل
    if (envContent.includes("JWT_SECRET=")) {
      // استبدال القيمة الحالية
      envContent = envContent.replace(/JWT_SECRET=.*(\r?\n|$)/g, `JWT_SECRET=${newSecret}$1`)
      console.log("🔄 تم استبدال JWT_SECRET الموجود")
    } else {
      // إضافة المتغير الجديد
      envContent += `\nJWT_SECRET=${newSecret}\n`
      console.log("➕ تم إضافة JWT_SECRET جديد")
    }

    // كتابة المحتوى المحدث
    fs.writeFileSync(envPath, envContent)
    return true
  } catch (error) {
    console.error("❌ خطأ في تحديث ملف .env:", error.message)
    return false
  }
}

// الدالة الرئيسية
function resetJwtSecret() {
  console.log("🔑 جاري إنشاء JWT Secret جديد...")

  const newSecret = generateSecureSecret()
  console.log(`✅ تم إنشاء مفتاح جديد بطول ${newSecret.length} حرف`)

  if (updateEnvFile(newSecret)) {
    console.log("✅ تم تحديث ملف .env بنجاح")
    console.log("\n🔐 تم إعادة تعيين JWT Secret بنجاح!")
    console.log("⚠️  يرجى إعادة تشغيل الخادم لتطبيق التغييرات.")
    console.log("\n📋 الخطوات التالية:")
    console.log("1. npm run build")
    console.log("2. npm start")
  } else {
    console.error("❌ فشل في تحديث ملف .env")
    process.exit(1)
  }
}

// تنفيذ السكريبت
resetJwtSecret()
