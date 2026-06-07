interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60_000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function getCleanupTimer() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of store) {
        if (now >= entry.resetAt) {
          store.delete(key)
        }
      }
    }, CLEANUP_INTERVAL)
    if (typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
      cleanupTimer.unref()
    }
  }
  return cleanupTimer
}

interface RateLimitOptions {
  windowMs: number
  max: number
  identifier: string
}

export function rateLimit({ windowMs, max, identifier }: RateLimitOptions) {
  getCleanupTimer()

  const now = Date.now()
  const key = identifier
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: max - 1, resetAt: now + windowMs }
  }

  entry.count++

  if (entry.count > max) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt }
  }

  return { limited: false, remaining: max - entry.count, resetAt: entry.resetAt }
}
