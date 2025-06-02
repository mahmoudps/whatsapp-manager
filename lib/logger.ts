type LogLevel = "debug" | "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
}

class Logger {
  private static instance: Logger
  private currentLogLevel: LogLevel = "info"

  private constructor() {
    this.setLogLevel()
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private setLogLevel(): void {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    if (["debug", "info", "warn", "error"].includes(envLevel)) {
      this.currentLogLevel = envLevel
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }
    return levels[level] >= levels[this.currentLogLevel]
  }

  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return
    }

    const timestamp = new Date().toISOString()
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    }

    const consoleMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`

    switch (level) {
      case "debug":
        console.debug(consoleMessage, data || "")
        break
      case "info":
        console.info(consoleMessage, data || "")
        break
      case "warn":
        console.warn(consoleMessage, data || "")
        break
      case "error":
        console.error(consoleMessage, data || "")
        break
    }

    // في بيئة الإنتاج، يمكن إضافة كتابة إلى ملف أو خدمة logging خارجية
    if (process.env.NODE_ENV === "production" && level === "error") {
      // يمكن إضافة integration مع خدمات مثل Sentry أو LogRocket
    }
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data)
  }

  info(message: string, data?: any): void {
    this.log("info", message, data)
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data)
  }

  error(message: string, data?: any): void {
    if (data instanceof Error) {
      const errorData = {
        message: data.message,
        stack: data.stack,
        name: data.name,
      }
      this.log("error", message, errorData)
    } else {
      this.log("error", message, data)
    }
  }

  // دالة لتنظيف السجلات القديمة
  cleanup(): void {
    // في بيئة الإنتاج، يمكن إضافة تنظيف للسجلات القديمة
    if (process.env.NODE_ENV === "production") {
      // تنظيف السجلات الأقدم من 30 يوم
      // يمكن تنفيذها لاحقاً مع قاعدة بيانات السجلات
    }
  }

  // دالة لتسجيل الأداء
  performance(label: string, startTime: number): void {
    const duration = Date.now() - startTime
    this.info(`Performance: ${label}`, { duration: `${duration}ms` })
  }

  // دالة لتسجيل العمليات المهمة
  audit(action: string, userId?: string, details?: any): void {
    this.info(`Audit: ${action}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...details,
    })
  }
}

export const logger = Logger.getInstance()
