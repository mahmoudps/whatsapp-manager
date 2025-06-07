interface CacheItem<T> {
  value: T
  expiresAt: number
}

export class MemoryCache {
  private static instance: MemoryCache
  private cache: Map<string, CacheItem<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout

  private constructor() {
    // تنظيف البيانات المنتهية الصلاحية كل 5 دقائق
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000,
    )
  }

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache()
    }
    return MemoryCache.instance
  }

  set<T>(key: string, value: T, ttlSeconds = 300): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiresAt })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

export const cache = MemoryCache.getInstance()

// دوال مساعدة للكاش
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join(":")
}

export async function getCachedOrFetch<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 300): Promise<T> {
  const cached = cache.get<T>(key)

  if (cached !== null) {
    return cached
  }

  const result = await fetchFn()
  cache.set(key, result, ttlSeconds)

  return result
}
