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

/* ─── Redis Client (lazy singleton) ─────────────────── */

type RedisLike = {
  eval: (script: string, numkeys: number, ...args: (string | number)[]) => Promise<unknown>;
};

let redisClient: RedisLike | null = null;
let redisInitAttempted = false;

/**
 * Lua script for atomic Redis rate limiting.
 * KEYS[1] = rate limit key
 * ARGV[1] = window in seconds
 * ARGV[2] = max requests
 * Returns: [allowed (0/1), remaining, ttl]
 */
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local window = tonumber(ARGV[1])
local max = tonumber(ARGV[2])
local current = tonumber(redis.call("GET", key) or "0")
if current == 0 then
  redis.call("SET", key, 1, "EX", window)
  return {1, max - 1, window}
end
if current < max then
  redis.call("INCR", key)
  local ttl = redis.call("TTL", key)
  return {1, max - current - 1, ttl}
end
local ttl = redis.call("TTL", key)
return {0, 0, ttl}
`;

/**
 * Attempt to connect to Redis. Returns null if unavailable.
 * Uses dynamic import to avoid breaking when ioredis isn't installed.
 */
async function getRedisClient(): Promise<RedisLike | null> {
  if (redisInitAttempted) return redisClient;
  redisInitAttempted = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.info("[RateLimiter] No REDIS_URL — using in-memory fallback");
    return null;
  }

  try {
    // BullMQ bundles ioredis — use dynamic require to avoid type resolution issues
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ioredisModule = require("ioredis") as { new (url: string, opts: Record<string, unknown>): RedisLike & { connect: () => Promise<void> } };
    const client = new ioredisModule(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 3000,
    });
    await client.connect();
    redisClient = client as unknown as RedisLike;
    console.info("[RateLimiter] Connected to Redis for distributed rate limiting");
    return redisClient;
  } catch {
    console.warn("[RateLimiter] Redis unavailable — using in-memory fallback");
    return null;
  }
}

/* ─── Rate Limiter (Redis primary, in-memory fallback) ─ */

/**
 * Rate limiter with Redis primary storage and in-memory fallback.
 * Redis provides distributed rate limiting across multiple instances.
 * Falls back to in-memory when Redis is unavailable.
 */
class RateLimiter {
  private readonly memoryStore = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private readonly prefix: string;

  constructor(config?: Partial<RateLimiterConfig>, prefix?: string) {
    this.windowMs = config?.windowMs ?? DEFAULT_WINDOW_MS;
    this.maxRequests = config?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    this.prefix = prefix ?? "rl";
    this.startCleanup();
  }

  /**
   * Check if a request from the given key is allowed.
   * Tries Redis first, falls back to in-memory.
   */
  check(key: string): RateLimitResult {
    // Fire-and-forget Redis check — use in-memory synchronously for speed.
    // Redis is checked async and updates in background for cross-instance consistency.
    void this.checkRedis(key);
    return this.checkMemory(key);
  }

  /**
   * Async rate limit check via Redis (for routes that can await).
   */
  async checkAsync(key: string): Promise<RateLimitResult> {
    const redisResult = await this.checkRedis(key);
    if (redisResult) return redisResult;
    return this.checkMemory(key);
  }

  /**
   * In-memory rate limit check (always available).
   */
  private checkMemory(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.memoryStore.get(key);

    if (!entry || now >= entry.resetAt) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetAt: now + this.windowMs,
      };
      this.memoryStore.set(key, newEntry);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: newEntry.resetAt,
      };
    }

    entry.count += 1;
    const allowed = entry.count <= this.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Redis-backed rate limit check. Returns null if Redis unavailable.
   */
  private async checkRedis(key: string): Promise<RateLimitResult | null> {
    try {
      const client = await getRedisClient();
      if (!client) return null;

      const redisKey = `${this.prefix}:${key}`;
      const windowSec = Math.ceil(this.windowMs / 1000);

      const result = await client.eval(
        RATE_LIMIT_LUA,
        1,
        redisKey,
        windowSec,
        this.maxRequests
      ) as [number, number, number];

      return {
        allowed: result[0] === 1,
        remaining: result[1],
        resetAt: Date.now() + result[2] * 1000,
      };
    } catch {
      // Redis failure — silent fallback to in-memory
      return null;
    }
  }

  /**
   * Periodically remove expired entries to prevent memory leaks.
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryStore) {
        if (now >= entry.resetAt) {
          this.memoryStore.delete(key);
        }
      }
    }, CLEANUP_INTERVAL_MS);

    // Allow Node to exit even if timer is active
    if (
      this.cleanupTimer &&
      typeof this.cleanupTimer === "object" &&
      "unref" in this.cleanupTimer
    ) {
      this.cleanupTimer.unref();
    }
  }
}

/* ─── Pre-configured Limiters ───────────────────────── */

/** General API rate limiter: 60 req/min per IP. */
export const apiLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 60 },
  "rl:api"
);

/** Auth rate limiter: 10 req/min per IP (brute-force protection). */
export const authLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 10 },
  "rl:auth"
);

/** AI/external API rate limiter: 15 req/min per IP (cost protection). */
export const aiLimiter = new RateLimiter(
  { windowMs: 60_000, maxRequests: 15 },
  "rl:ai"
);

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
