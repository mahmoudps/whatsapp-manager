// إعدادات المشروع

// إعدادات المصادقة
export const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production"
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h"
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"
export const MAX_AUTH_ATTEMPTS = Number.parseInt(process.env.MAX_AUTH_ATTEMPTS || "5")

// إعدادات المصادقة الإدارية
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

// إعدادات الخادم
export const PORT = Number.parseInt(process.env.PORT || "3000")
export const HOST = process.env.HOST || "0.0.0.0"
export const CORS_ORIGIN = process.env.CORS_ORIGIN
export const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100")

// إعدادات قاعدة البيانات
export const DATABASE_PATH = process.env.DATABASE_PATH || "./data/whatsapp_manager.db"

// إعدادات WebSocket
export const ENABLE_WEBSOCKET = process.env.ENABLE_WEBSOCKET === "true"
export const WEBSOCKET_PORT = Number.parseInt(process.env.WEBSOCKET_PORT || "3001")

// إعدادات WhatsApp
export const WHATSAPP_SERVER_PORT = Number.parseInt(process.env.WHATSAPP_SERVER_PORT || "3002")
export const PUPPETEER_EXECUTABLE_PATH = process.env.PUPPETEER_EXECUTABLE_PATH

// إعدادات السجلات
export const LOG_LEVEL = process.env.LOG_LEVEL || "info"
