import { RATE_LIMIT_MAX_REQUESTS } from "./config"
import { logger } from "./logger"

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

export class RateLimiter {
  private options: RateLimitOptions
  private store: Map<string, RateLimitRecord> = new Map()

  constructor(options?: Partial<RateLimitOptions>) {
    this.options = {
      windowMs: options?.windowMs || 60 * 1000, // 1 دقيقة افتراضياً
      maxRequests: options?.maxRequests || RATE_LIMIT_MAX_REQUESTS,
    }

    // تنظيف السجلات القديمة كل دقيقة
    setInterval(() => this.cleanup(), 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }

  check(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      // إنشاء سجل جديد
      this.store.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs,
      })
      return { allowed: true, remaining: this.options.maxRequests - 1, resetTime: now + this.options.windowMs }
    }

    // تحديث السجل الحالي
    if (record.count < this.options.maxRequests) {
      record.count++
      return { allowed: true, remaining: this.options.maxRequests - record.count, resetTime: record.resetTime }
    }

    // تجاوز الحد الأقصى
    logger.warn(`Rate limit exceeded for ${key}`)
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }
}

export const globalRateLimiter = new RateLimiter()
