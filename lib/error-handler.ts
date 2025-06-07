<<<<<<< HEAD
import { logger } from "./logger"

export interface ErrorResponse {
  success: false
  error: string
  details?: string
  timestamp: string
}

export interface SuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  timestamp: string
}

export type ApiResponse<T = any> = ErrorResponse | SuccessResponse<T>

export class ErrorHandler {
  static setupGlobalHandlers() {
    if (typeof window !== "undefined") {
      // Client-side error handling
      window.addEventListener("error", (event) => {
        logger.error("Unhandled error:", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
        })
      })

      window.addEventListener("unhandledrejection", (event) => {
        logger.error("Unhandled promise rejection:", {
          reason: event.reason,
        })
      })
    } else {
      // Server-side error handling
      process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled Promise Rejection:", {
          reason: reason instanceof Error ? reason.message : reason,
          stack: reason instanceof Error ? reason.stack : undefined,
        })
      })

      process.on("uncaughtException", (error) => {
        logger.error("Uncaught Exception:", {
          message: error.message,
          stack: error.stack,
        })
      })
    }
  }

  static createError(message: string, details?: string): ErrorResponse {
    return {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString(),
    }
  }

  static createSuccess<T>(data?: T, message?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }
  }

  static handleDatabaseError(error: any): ErrorResponse {
    logger.error("Database error:", error)

    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return this.createError("البيانات موجودة مسبقاً", "Duplicate entry")
    }

    if (error.code === "SQLITE_CONSTRAINT_FOREIGN_KEY") {
      return this.createError("خطأ في العلاقة بين البيانات", "Foreign key constraint")
    }

    return this.createError("خطأ في قاعدة البيانات", error.message)
  }

  static handleValidationError(error: any): ErrorResponse {
    logger.error("Validation error:", error)
    return this.createError("بيانات غير صحيحة", error.message)
  }

  static handleAuthError(error: any): ErrorResponse {
    logger.error("Auth error:", error)
    return this.createError("خطأ في المصادقة", error.message)
  }

  static handleGenericError(error: any): ErrorResponse {
    logger.error("Generic error:", error)
    return this.createError("خطأ في الخادم", error.message)
  }
}

// Export as default for backward compatibility
export default ErrorHandler
=======
export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: Date
  url?: string
  userAgent?: string
}

export class ErrorHandler {
  private static errors: ErrorInfo[] = []
  private static maxErrors = 100

  static logError(error: Error | string, additionalInfo?: any): void {
    const errorInfo: ErrorInfo = {
      message: typeof error === "string" ? error : error.message,
      stack: typeof error === "object" ? error.stack : undefined,
      timestamp: new Date(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      ...additionalInfo,
    }

    this.errors.push(errorInfo)

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error logged:", errorInfo)
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoring(errorInfo)
    }
  }

  static getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  static clearErrors(): void {
    this.errors = []
  }

  static setupGlobalHandlers(): void {
    if (typeof window === "undefined") return

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError(`Unhandled Promise Rejection: ${event.reason}`)
    })

    // Handle global errors
    window.addEventListener("error", (event) => {
      this.logError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })
  }

  private static async sendToMonitoring(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Send to your monitoring service (e.g., Sentry, LogRocket, etc.)
      await fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorInfo),
      })
    } catch (err) {
      console.error("Failed to send error to monitoring service:", err)
    }
  }
}

// React Error Boundary Hook
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    ErrorHandler.logError(error, errorInfo)
  }
}
>>>>>>> 83e0b5f7cbb5c54a0d6a252d420d7c6ecc85a6da
