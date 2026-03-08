// Copyright (c) Said Borna. All rights reserved.

/* ─── Constants ─────────────────────────────────────── */

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 30;
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes

/* ─── Types ─────────────────────────────────────────── */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  /** Time window in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed within the window. */
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/* ─── In-Memory Rate Limiter ────────────────────────── */

/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-instance deployments.
 * For multi-instance, replace with Redis-backed implementation.
 */
class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxRequests = config?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    this.startCleanup();
  }

  /**
   * Check if a request from the given key is allowed.
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.store.set(key, newEntry);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    // Within existing window
    entry.count += 1;
    const allowed = entry.count <= this.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Periodically remove expired entries to prevent memory leaks.
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now >= entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, CLEANUP_INTERVAL_MS);

    // Allow Node to exit even if timer is active
    if (this.cleanupTimer && typeof this.cleanupTimer === "object" && "unref" in this.cleanupTimer) {
      this.cleanupTimer.unref();
    }
  }
}

/* ─── Pre-configured Limiters ───────────────────────── */

/** General API rate limiter: 60 req/min per IP. */
export const apiLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 60,
});

/** Auth rate limiter: 10 req/min per IP (brute-force protection). */
export const authLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 10,
});

/** AI/external API rate limiter: 15 req/min per IP (cost protection). */
export const aiLimiter = new RateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
});

/* ─── Helper ────────────────────────────────────────── */

/**
 * Extract a rate-limit key from a request.
 * Uses X-Forwarded-For header (behind proxy) or falls back to a default key.
 */
export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
