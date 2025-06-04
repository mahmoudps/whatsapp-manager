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
