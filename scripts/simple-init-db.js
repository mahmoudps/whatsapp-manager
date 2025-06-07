const fs = require("fs")
const path = require("path")

// إنشاء مجلد data
const dataDir = path.join(__dirname, "..", "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// إنشاء ملف قاعدة بيانات فارغ
const dbPath = path.join(dataDir, "whatsapp_manager.db")
fs.writeFileSync(dbPath, "")

console.log("✅ تم إنشاء قاعدة البيانات في:", dbPath)
console.log("ℹ️ سيتم تهيئة الجداول عند أول تشغيل للتطبيق")
