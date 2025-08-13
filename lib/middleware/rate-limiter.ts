interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private windowMs: number
  private maxRequests: number

  constructor(windowMs = 60000, maxRequests = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now()
    const key = identifier

    // Clean up expired entries
    if (this.store[key] && now > this.store[key].resetTime) {
      delete this.store[key]
    }

    // Initialize or get current count
    if (!this.store[key]) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.windowMs,
      }
    }

    const entry = this.store[key]

    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      }
    }

    entry.count++
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
    }
  }

  reset(identifier: string) {
    delete this.store[identifier]
  }
}

// Global rate limiter instances
export const globalRateLimiter = new RateLimiter(60000, 30) // 30 requests per minute globally
export const userRateLimiter = new RateLimiter(300000, 5) // 5 requests per 5 minutes per user
