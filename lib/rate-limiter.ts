interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

export class RateLimiter {
  private store: RateLimitStore = {}
  private windowMs: number
  private maxRequests: number

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // تنظيف البيانات المنتهية الصلاحية كل دقيقة
    setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = identifier

    if (!this.store[key] || now > this.store[key].resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: this.store[key].resetTime,
      }
    }

    this.store[key].count++

    const allowed = this.store[key].count <= this.maxRequests
    const remaining = Math.max(0, this.maxRequests - this.store[key].count)

    return {
      allowed,
      remaining,
      resetTime: this.store[key].resetTime,
    }
  }

  private cleanup(): void {
    const now = Date.now()
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime) {
        delete this.store[key]
      }
    })
  }
}

// إنشاء rate limiters مختلفة
export const generalLimiter = new RateLimiter(60000, 100) // 100 requests per minute
export const messageLimiter = new RateLimiter(60000, 50) // 50 messages per minute
export const authLimiter = new RateLimiter(900000, 5) // 5 login attempts per 15 minutes
