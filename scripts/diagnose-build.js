#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

console.log("🔍 بدء تشخيص مشاكل البناء...\n")

// التحقق من وجود ملف babel.config.js
const babelConfigPath = path.join(process.cwd(), "babel.config.js")
if (fs.existsSync(babelConfigPath)) {
  console.log("⚠️ تم العثور على ملف babel.config.js الذي يتعارض مع SWC")
  console.log("   يجب حذف هذا الملف لتمكين SWC وتحسين أداء البناء")
  console.log("   أمر الحذف: rm babel.config.js\n")
} else {
  console.log("✅ لا يوجد ملف babel.config.js (جيد)\n")
}

// التحقق من التبعيات المفقودة
console.log("🔍 التحقق من التبعيات المفقودة...")

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
  console.log("⚠️ التبعيات المفقودة:")
  missingDependencies.forEach((dep) => {
    console.log(`   - ${dep}`)
  })
  console.log(`\n   أمر التثبيت: npm install ${missingDependencies.join(" ")}\n`)
} else {
  console.log("✅ جميع التبعيات المطلوبة موجودة\n")
}

// التحقق من وجود ملف tsconfig.json
const tsconfigPath = path.join(process.cwd(), "tsconfig.json")
if (!fs.existsSync(tsconfigPath)) {
  console.log("⚠️ ملف tsconfig.json غير موجود")
  console.log("   يجب إنشاء ملف tsconfig.json لتمكين TypeScript\n")
} else {
  console.log("✅ ملف tsconfig.json موجود\n")
}

// التحقق من وجود دالة verifyAuth في lib/auth.ts
const authPath = path.join(process.cwd(), "lib", "auth.ts")
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, "utf8")
  if (!authContent.includes("export async function verifyAuth")) {
    console.log("⚠️ دالة verifyAuth غير موجودة في lib/auth.ts")
    console.log("   يجب إضافة هذه الدالة لتمكين المصادقة\n")
  } else {
    console.log("✅ دالة verifyAuth موجودة في lib/auth.ts\n")
  }
} else {
  console.log("⚠️ ملف lib/auth.ts غير موجود\n")
}

// التحقق من وجود مكونات UI
const uiComponentsPath = path.join(process.cwd(), "components", "ui")
if (!fs.existsSync(uiComponentsPath)) {
  console.log("⚠️ مجلد components/ui غير موجود")
  console.log("   يجب إنشاء مكونات UI باستخدام shadcn/ui\n")
} else {
  const requiredComponents = ["button.tsx", "card.tsx", "input.tsx", "badge.tsx", "avatar.tsx", "dropdown-menu.tsx"]

  const missingComponents = []

  requiredComponents.forEach((comp) => {
    if (!fs.existsSync(path.join(uiComponentsPath, comp))) {
      missingComponents.push(comp)
    }
  })

  if (missingComponents.length > 0) {
    console.log("⚠️ مكونات UI المفقودة:")
    missingComponents.forEach((comp) => {
      console.log(`   - ${comp}`)
    })
    console.log("\n")
  } else {
    console.log("✅ جميع مكونات UI الأساسية موجودة\n")
  }
}

console.log("🔍 تشخيص اكتمل. قم بإصلاح المشاكل المذكورة أعلاه ثم أعد تشغيل البناء.")
