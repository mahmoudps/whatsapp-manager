#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")
const { logger } = require("../lib/logger.ts")

logger.info("🔍 بدء تشخيص مشاكل البناء...\n")

// التحقق من وجود ملف babel.config.js
const babelConfigPath = path.join(process.cwd(), "babel.config.js")
if (fs.existsSync(babelConfigPath)) {
  logger.info("⚠️ تم العثور على ملف babel.config.js الذي يتعارض مع SWC")
  logger.info("   يجب حذف هذا الملف لتمكين SWC وتحسين أداء البناء")
  logger.info("   أمر الحذف: rm babel.config.js\n")
} else {
  logger.info("✅ لا يوجد ملف babel.config.js (جيد)\n")
}

// التحقق من التبعيات المفقودة
logger.info("🔍 التحقق من التبعيات المفقودة...")

const packageJsonPath = path.join(process.cwd(), "package.json")
const packageJson = require(packageJsonPath)
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

const requiredDependencies = ["framer-motion", "next-themes", "better-sqlite3", "@types/better-sqlite3"]

const missingDependencies = []

requiredDependencies.forEach((dep) => {
  if (!dependencies[dep]) {
    missingDependencies.push(dep)
  }
})

if (missingDependencies.length > 0) {
  logger.info("⚠️ التبعيات المفقودة:")
  missingDependencies.forEach((dep) => {
    logger.info(`   - ${dep}`)
  })
  logger.info(`\n   أمر التثبيت: npm install ${missingDependencies.join(" ")}\n`)
} else {
  logger.info("✅ جميع التبعيات المطلوبة موجودة\n")
}

// التحقق من وجود ملف tsconfig.json
const tsconfigPath = path.join(process.cwd(), "tsconfig.json")
if (!fs.existsSync(tsconfigPath)) {
  logger.info("⚠️ ملف tsconfig.json غير موجود")
  logger.info("   يجب إنشاء ملف tsconfig.json لتمكين TypeScript\n")
} else {
  logger.info("✅ ملف tsconfig.json موجود\n")
}

// التحقق من وجود دالة verifyAuth في lib/auth.ts
const authPath = path.join(process.cwd(), "lib", "auth.ts")
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, "utf8")
  if (!authContent.includes("export async function verifyAuth")) {
    logger.info("⚠️ دالة verifyAuth غير موجودة في lib/auth.ts")
    logger.info("   يجب إضافة هذه الدالة لتمكين المصادقة\n")
  } else {
    logger.info("✅ دالة verifyAuth موجودة في lib/auth.ts\n")
  }
} else {
  logger.info("⚠️ ملف lib/auth.ts غير موجود\n")
}

// التحقق من وجود مكونات UI
const uiComponentsPath = path.join(process.cwd(), "components", "ui")
if (!fs.existsSync(uiComponentsPath)) {
  logger.info("⚠️ مجلد components/ui غير موجود")
  logger.info("   يجب إنشاء مكونات UI باستخدام shadcn/ui\n")
} else {
  const requiredComponents = ["button.tsx", "card.tsx", "input.tsx", "badge.tsx", "avatar.tsx", "dropdown-menu.tsx"]

  const missingComponents = []

  requiredComponents.forEach((comp) => {
    if (!fs.existsSync(path.join(uiComponentsPath, comp))) {
      missingComponents.push(comp)
    }
  })

  if (missingComponents.length > 0) {
    logger.info("⚠️ مكونات UI المفقودة:")
    missingComponents.forEach((comp) => {
      logger.info(`   - ${comp}`)
    })
    logger.info("\n")
  } else {
    logger.info("✅ جميع مكونات UI الأساسية موجودة\n")
  }
}

logger.info("🔍 تشخيص اكتمل. قم بإصلاح المشاكل المذكورة أعلاه ثم أعد تشغيل البناء.")
