#!/usr/bin/env node

/**
 * سكريبت لإعادة تعيين JWT Secret
 * يقوم بإنشاء مفتاح جديد وتحديث ملف .env
 */

const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const { logger } = require("../lib/logger.ts")

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
      logger.info("📄 ملف .env غير موجود. سيتم إنشاؤه.")
      fs.writeFileSync(envPath, `JWT_SECRET=${newSecret}\n`)
      return true
    }

    // قراءة الملف الحالي
    let envContent = fs.readFileSync(envPath, "utf8")

    // التحقق مما إذا كان JWT_SECRET موجوداً بالفعل
    if (envContent.includes("JWT_SECRET=")) {
      // استبدال القيمة الحالية
      envContent = envContent.replace(/JWT_SECRET=.*(\r?\n|$)/g, `JWT_SECRET=${newSecret}$1`)
      logger.info("🔄 تم استبدال JWT_SECRET الموجود")
    } else {
      // إضافة المتغير الجديد
      envContent += `\nJWT_SECRET=${newSecret}\n`
      logger.info("➕ تم إضافة JWT_SECRET جديد")
    }

    // كتابة المحتوى المحدث
    fs.writeFileSync(envPath, envContent)
    return true
  } catch (error) {
    logger.error("❌ خطأ في تحديث ملف .env:", error.message)
    return false
  }
}

// الدالة الرئيسية
function resetJwtSecret() {
  logger.info("🔑 جاري إنشاء JWT Secret جديد...")

  const newSecret = generateSecureSecret()
  logger.info(`✅ تم إنشاء مفتاح جديد بطول ${newSecret.length} حرف`)

  if (updateEnvFile(newSecret)) {
    logger.info("✅ تم تحديث ملف .env بنجاح")
    logger.info("\n🔐 تم إعادة تعيين JWT Secret بنجاح!")
    logger.info("⚠️  يرجى إعادة تشغيل الخادم لتطبيق التغييرات.")
    logger.info("\n📋 الخطوات التالية:")
    logger.info("1. npm run build")
    logger.info("2. npm start")
  } else {
    logger.error("❌ فشل في تحديث ملف .env")
    process.exit(1)
  }
}

// تنفيذ السكريبت
resetJwtSecret()
