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
