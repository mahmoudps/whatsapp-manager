require("dotenv").config()

// تكوين متغيرات البيئة مع قيم افتراضية آمنة
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== "production" ? "your-secret-key" : undefined)

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is not defined in production environment")
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"

// إعدادات إضافية
const config = {
  // إعدادات الخادم
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || "0.0.0.0",
  NODE_ENV: process.env.NODE_ENV || "development",

  // إعدادات JWT
  JWT_SECRET,
  JWT_EXPIRES_IN,

  // إعدادات المدير
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  MAX_AUTH_ATTEMPTS: Number.parseInt(process.env.MAX_AUTH_ATTEMPTS) || 5,

  // إعدادات قاعدة البيانات
  DATABASE_PATH: process.env.DATABASE_PATH || "./data/whatsapp_manager.db",

  // إعدادات WebSocket
  WEBSOCKET_PORT: Number.parseInt(process.env.WEBSOCKET_PORT) || 3001,
  ENABLE_WEBSOCKET: process.env.ENABLE_WEBSOCKET === "true",
  NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3001",

  // إعدادات WhatsApp
  WHATSAPP_SERVER_PORT: Number.parseInt(process.env.WHATSAPP_SERVER_PORT) || 3002,
  PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium-browser",

  // إعدادات الدومين
  NEXT_PUBLIC_DOMAIN_NAME: process.env.NEXT_PUBLIC_DOMAIN_NAME || "localhost",
  NEXT_PUBLIC_WHATSAPP_API_URL: process.env.NEXT_PUBLIC_WHATSAPP_API_URL || "http://localhost:3000/api",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // إعدادات السجلات
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
}

// تصدير المتغيرات المطلوبة بالاسم
module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  config,
}
