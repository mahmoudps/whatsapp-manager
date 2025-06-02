// إنشاء ملف جديد لأدوات جودة الكود
export class CodeQualityUtils {
  // دالة للتحقق من صحة رقم الهاتف مع تحسينات
  static validatePhoneNumber(phone: string): { isValid: boolean; formatted?: string; error?: string } {
    try {
      // إزالة جميع الرموز غير الرقمية
      let cleaned = phone.replace(/\D/g, "")

      // معالجة الأرقام الدولية
      if (phone.startsWith("+")) {
        cleaned = phone.substring(1).replace(/\D/g, "")
      }

      // معالجة الأرقام التي تبدأ بـ 00
      if (cleaned.startsWith("00")) {
        cleaned = cleaned.substring(2)
      }

      // معالجة الأرقام السعودية المحلية
      if (cleaned.startsWith("0") && cleaned.length === 10) {
        cleaned = "966" + cleaned.substring(1)
      }

      // التحقق من طول الرقم
      if (cleaned.length < 10 || cleaned.length > 15) {
        return { isValid: false, error: "Invalid phone number length" }
      }

      // التحقق من الأنماط المعروفة
      const patterns = [
        /^966[5][0-9]{8}$/, // السعودية
        /^971[5][0-9]{8}$/, // الإمارات
        /^974[3-7][0-9]{7}$/, // قطر
        /^965[569][0-9]{7}$/, // الكويت
      ]

      const isKnownPattern = patterns.some((pattern) => pattern.test(cleaned))

      return {
        isValid: true,
        formatted: cleaned + "@c.us",
        error: isKnownPattern ? undefined : "Unknown country code pattern",
      }
    } catch (error) {
      return { isValid: false, error: "Phone validation error" }
    }
  }

  // دالة للتحقق من صحة الرسالة
  static validateMessage(message: string): { isValid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
      return { isValid: false, error: "Message cannot be empty" }
    }

    if (message.length > 4096) {
      return { isValid: false, error: "Message too long (max 4096 characters)" }
    }

    // فحص المحتوى المشبوه
    const suspiciousPatterns = [/spam/i, /click here/i, /urgent/i, /winner/i]

    const hasSuspiciousContent = suspiciousPatterns.some((pattern) => pattern.test(message))

    return {
      isValid: true,
      error: hasSuspiciousContent ? "Message contains suspicious content" : undefined,
    }
  }

  // دالة لتنظيف البيانات
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, "") // إزالة HTML tags
      .replace(/javascript:/gi, "") // إزالة JavaScript
      .substring(0, 1000) // تحديد الطول الأقصى
  }

  // دالة لتوليد معرف فريد
  static generateUniqueId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // دالة لقياس الأداء
  static measurePerformance<T>(fn: () => T, label: string): T {
    const start = Date.now()
    const result = fn()
    const duration = Date.now() - start

    if (duration > 1000) {
      console.warn(`Performance warning: ${label} took ${duration}ms`)
    }

    return result
  }
}

// دالة مساعدة للتحقق من البيئة
export const isDevelopment = () => process.env.NODE_ENV === "development"
export const isProduction = () => process.env.NODE_ENV === "production"
export const isTest = () => process.env.NODE_ENV === "test"

// دالة للتحقق من الموارد المتاحة
export const checkSystemResources = () => {
  const used = process.memoryUsage()
  const total = require("os").totalmem()
  const free = require("os").freemem()

  return {
    memory: {
      used: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
      total: Math.round((total / 1024 / 1024) * 100) / 100,
      free: Math.round((free / 1024 / 1024) * 100) / 100,
      percentage: Math.round((used.heapUsed / total) * 100),
    },
    uptime: process.uptime(),
  }
}
