#!/usr/bin/env node

/**
 * سكريبت إعداد شامل لـ WhatsApp Manager
 * يقوم بإعداد البيئة وتهيئة المشروع
 */

require("dotenv").config()
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const readline = require("readline")
const crypto = require("crypto")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer)
    })
  })
}

function generateJwtSecret() {
  return crypto.randomBytes(32).toString("hex")
}

function generateRandomPassword(length = 16) {
  return crypto.randomBytes(length).toString("hex").slice(0, length)
}

async function setup() {
  console.log("🚀 مرحبًا بك في إعداد WhatsApp Manager")
  
  const envVars = {}
  
  // JWT_SECRET
  const useRandomJwtSecret = await question("هل تريد استخدام JWT_SECRET عشوائي؟ (y/n): ")
  
  if (useRandomJwtSecret.toLowerCase() === "y") {
    envVars.JWT_SECRET = generateJwtSecret()
    console.log("✅ تم إنشاء JWT_SECRET عشوائي")
  } else {
    envVars.JWT_SECRET = await question("أدخل JWT_SECRET: ")
    if (!envVars.JWT_SECRET) {
      envVars.JWT_SECRET = generateJwtSecret()
      console.log("⚠️ تم استخدام JWT_SECRET عشوائي")
    }
  }
  
  // بيانات المدير
  envVars.ADMIN_USERNAME = await question("أدخل اسم المستخدم للمدير (admin): ") || "admin"
  
  const useRandomPassword = await question("هل تريد استخدام كلمة مرور عشوائية؟ (y/n): ")
  
  if (useRandomPassword.toLowerCase() === "y") {
    envVars.ADMIN_PASSWORD = generateRandomPassword()
    console.log(`✅ كلمة المرور: ${envVars.ADMIN_PASSWORD}`)
    console.log("⚠️ احفظ كلمة المرور هذه!")
  } else {
    envVars.ADMIN_PASSWORD = await question("أدخل كلمة مرور المدير: ") || "admin123"
  }
  
  // إعدادات أخرى
  envVars.NODE_ENV = "development"
  envVars.PORT = "3000"
  envVars.WEBSOCKET_PORT = "3001"
  envVars.DATABASE_PATH = "./data/whatsapp_manager.db"
  envVars.ENABLE_WEBSOCKET = "true"
  
  // إنشاء ملف .env
  let envContent = ""
  for (const [key, value] of Object.entries(envVars)) {
    envContent += `${key}=${value}\n`
  }
  
  fs.writeFileSync(".env", envContent)
  console.log("✅ تم إنشاء ملف .env")
  
  // إنشاء المجلدات
  const dirs = ["data", "data/whatsapp_sessions", "data/media", "logs"]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
      console.log(`✅ تم إنشاء المجلد: ${dir}`)
    }
  }
  
  console.log("\n🎉 تم إعداد WhatsApp Manager بنجاح!")
  console.log(`\n📋 معلومات الوصول:`)
  console.log(`   اسم المستخدم: ${envVars.ADMIN_USERNAME}`)
  console.log(`   كلمة المرور: ${envVars.ADMIN_PASSWORD}`)
  
  rl.close()
}

setup().catch(error => {
  console.error(`خطأ في الإعداد: ${error.message}`)
  rl.close()
  process.exit(1)
})
