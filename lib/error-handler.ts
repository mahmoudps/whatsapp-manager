// إنشاء معالج أخطاء مركزي
import { logger } from "./logger"

export class ErrorHandler {
  static handle(error: Error, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
    }

    logger.error("Unhandled error", errorInfo)

    // في بيئة الإنتاج، يمكن إرسال التقرير لخدمة مراقبة
    if (process.env.NODE_ENV === "production") {
      // إرسال لـ Sentry أو خدمة مراقبة أخرى
      this.reportToMonitoring(errorInfo)
    }
  }

  static async handleAsync(promise: Promise<any>, context?: string): Promise<any> {
    try {
      return await promise
    } catch (error) {
      this.handle(error as Error, context)
      throw error
    }
  }

  private static reportToMonitoring(errorInfo: any): void {
    // تنفيذ إرسال التقرير لخدمة المراقبة
    // مثل Sentry, LogRocket, أو خدمة مخصصة
  }

  static setupGlobalHandlers(): void {
    process.on("uncaughtException", (error) => {
      this.handle(error, "uncaughtException")
      process.exit(1)
    })

    process.on("unhandledRejection", (reason, promise) => {
      this.handle(new Error(`Unhandled Rejection: ${reason}`), "unhandledRejection")
    })
  }
}

// تفعيل معالجات الأخطاء العامة
ErrorHandler.setupGlobalHandlers()
