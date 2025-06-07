// نظام تسجيل السجلات المبسط
type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLogLevel = LOG_LEVELS[(process.env.LOG_LEVEL as LogLevel) || "info"]

class Logger {
  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const formattedArgs = args.map((arg) => {
      if (typeof arg === "object") {
        return JSON.stringify(arg)
      }
      return arg
    })
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedArgs.join(" ")}`
  }

  debug(message: string, ...args: any[]): void {
    if (currentLogLevel <= LOG_LEVELS.debug) {
      console.debug(this.formatMessage("debug", message, ...args))
    }
  }

  info(message: string, ...args: any[]): void {
    if (currentLogLevel <= LOG_LEVELS.info) {
      console.info(this.formatMessage("info", message, ...args))
    }
  }

  warn(message: string, ...args: any[]): void {
    if (currentLogLevel <= LOG_LEVELS.warn) {
      console.warn(this.formatMessage("warn", message, ...args))
    }
  }

  error(messageOrError: string | Error, ...args: any[]): void {
    if (currentLogLevel <= LOG_LEVELS.error) {
      let message: string
      const processedArgs = args.map((arg) =>
        arg instanceof Error ? arg.stack || String(arg) : arg,
      )

      if (messageOrError instanceof Error) {
        message = messageOrError.stack || String(messageOrError)
      } else {
        message = messageOrError
      }

      console.error(this.formatMessage("error", message, ...processedArgs))
    }
  }
}

export const logger = new Logger()
export default logger
