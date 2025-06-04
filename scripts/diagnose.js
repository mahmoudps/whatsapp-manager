#!/usr/bin/env node

/**
 * سكريبت تشخيص شامل لـ WhatsApp Manager
 * يفحص جميع متطلبات النظام والإعدادات
 */

require("dotenv").config()
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const os = require("os")

// ألوان للطباعة
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  bright: "\x1b[1m",
}

function printHeader(text) {
  console.log(`\n${colors.blue}${colors.bright}=== ${text} ===${colors.reset}\n`)
}

function printSuccess(text) {
  console.log(`${colors.green}✓ ${text}${colors.reset}`)
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠ ${text}${colors.reset}`)
}

function printError(text) {
  console.log(`${colors.red}✗ ${text}${colors.reset}`)
}

function printInfo(text) {
  console.log(`${colors.cyan}ℹ ${text}${colors.reset}`)
}

async function runDiagnostics() {
  printHeader("بدء تشخيص WhatsApp Manager")
  console.log(`تاريخ التشغيل: ${new Date().toLocaleString()}`)
  console.log(`نظام التشغيل: ${os.type()} ${os.release()}`)
  console.log(`المعالج: ${os.cpus()[0].model}`)
  console.log(`الذاكرة: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`)
  
  let allPassed = true
  let warnings = 0
  
  // فحص متطلبات النظام
  printHeader("فحص متطلبات النظام")
  
  // فحص Node.js
  try {
    const nodeVersion = process.version
    const nodeVersionNum = Number.parseFloat(nodeVersion.slice(1))
    
    if (nodeVersionNum >= 18) {
      printSuccess(`Node.js: ${nodeVersion}`)
    } else {
      printWarning(`Node.js: ${nodeVersion} - يوصى بالإصدار 18 أو أعلى`)
      warnings++
    }
  } catch (error) {
    printError(`فشل فحص إصدار Node.js: ${error.message}`)
    allPassed = false
  }
  
  // فحص npm
  try {
    const npmVersion = execSync("npm --version").toString().trim()
    printSuccess(`npm: ${npmVersion}`)
  } catch (error) {
    printError(`فشل فحص إصدار npm: ${error.message}`)
    allPassed = false
  }
  
  // فحص PM2
  try {
    const pm2Version = execSync("pm2 --version").toString().trim()
    printSuccess(`PM2: ${pm2Version}`)
  } catch (error) {
    printError("PM2: غير مثبت أو غير متاح في PATH")
    printInfo("قم بتثبيت PM2 باستخدام: npm install -g pm2")
    allPassed = false
  }
  
  // فحص المجلدات والملفات
  printHeader("فحص المجلدات والملفات")
  
  const requiredDirs = ["data", "data/whatsapp_sessions", "data/media", "logs"]
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(process.cwd(), dir)
    
    if (fs.existsSync(dirPath)) {
      try {
        const testFile = path.join(dirPath, `.test-${Date.now()}`)
        fs.writeFileSync(testFile, "test")
        fs.unlinkSync(testFile)
        printSuccess(`المجلد ${dir}: موجود ولديه صلاحيات الكتابة`)
      } catch (error) {
        printError(`المجلد ${dir}: موجود ولكن لا يمكن الكتابة فيه`)
        allPassed = false
      }
    } else {
      printError(`المجلد ${dir}: غير موجود`)
      allPassed = false
    }
  }
  
  // فحص الملفات المطلوبة
  const requiredFiles = [
    "ecosystem.config.js",
    "websocket-server.js",
    "server.js",
    "lib/config.js",
  ]
  
  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file)
    
    if (fs.existsSync(filePath)) {
      printSuccess(`الملف ${file}: موجود`)
    } else {
      printError(`الملف ${file}: غير موجود`)
      allPassed = false
    }
  }
  
  // فحص متغيرات البيئة
  printHeader("فحص متغيرات البيئة")
  
  const requiredEnvVars = ["JWT_SECRET", "ADMIN_USERNAME", "ADMIN_PASSWORD"]
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      printSuccess(`${envVar}: تم تعيينه`)
    } else {
      printError(`${envVar}: غير معين`)
      allPassed = false
    }
  }
  
  // النتيجة النهائية
  printHeader("نتيجة التشخيص")
  
  if (allPassed && warnings === 0) {
    printSuccess("✅ جميع الفحوصات اجتازت بنجاح!")
    console.log(`\n${colors.green}${colors.bright}WhatsApp Manager جاهز للعمل!${colors.reset}\n`)
  } else if (allPassed) {
    printWarning(`⚠️ اجتازت جميع الفحوصات الأساسية، ولكن هناك ${warnings} تحذيرات`)
    console.log(`\n${colors.yellow}${colors.bright}WhatsApp Manager يعمل، ولكن يمكن تحسينه!${colors.reset}\n`)
  } else {
    printError("❌ فشلت بعض الفحوصات الأساسية")
    console.log(`\n${colors.red}${colors.bright}يجب إصلاح المشاكل قبل تشغيل WhatsApp Manager!${colors.reset}\n`)
  }
}

runDiagnostics().catch(error => {
  console.error(`خطأ في التشخيص: ${error.message}`)
  process.exit(1)
})
