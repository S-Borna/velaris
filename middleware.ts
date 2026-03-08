// Copyright (c) Said Borna. All rights reserved.
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ─── Constants ─────────────────────────────────────── */

/** API routes that do NOT require authentication. */
const PUBLIC_API_PATHS = new Set(["/api/auth"]);

/** Page routes that are public (no redirect to login). */
const PUBLIC_PAGE_PATHS = new Set(["/login", "/signup", "/"]);

const LOGIN_PATH = "/login";

/** HTTP methods that mutate state (subject to CSRF checks). */
const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Maximum request body size in bytes (1 MB). */
const MAX_BODY_SIZE_BYTES = 1_048_576;

/* ─── Edge-Compatible Rate Limiter ──────────────────── */

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // per IP per window
const AUTH_RATE_LIMIT_MAX = 10; // stricter for auth endpoints

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple edge-compatible rate limiter using in-memory Map.
 * For multi-instance production, replace with Redis-backed check.
 */
function checkRateLimit(key: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count += 1;
  return entry.count <= maxRequests;
}

/**
 * Extract IP key from request headers.
 */
function getIpKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

// Periodic cleanup to prevent memory leak (runs in long-lived Node.js process)
const CLEANUP_INTERVAL_MS = 120_000;
let cleanupScheduled = false;
function ensureCleanup(): void {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);
  if (typeof timer === "object" && "unref" in timer) {
    timer.unref();
  }
}

/* ─── Security Headers ──────────────────────────────── */

/**
 * Apply security headers to every response.
 */
function applySecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
}

/* ─── CSRF Protection ───────────────────────────────── */

/**
 * Verify Origin/Referer header matches the app's own host for state-changing requests.
 * Returns true if the request is safe, false if it's a potential CSRF attack.
 */
function verifyCsrf(request: NextRequest): boolean {
  const { method } = request;

  // Only check state-changing methods
  if (!STATE_CHANGING_METHODS.has(method)) {
    return true;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return false;
  }

  // Check Origin header first (most reliable)
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      return refererHost === host;
    } catch {
      return false;
    }
  }

  // No Origin or Referer — block by default for API routes
  // (allows direct API testing tools when no header is present — optional strictness)
  return false;
}

/* ─── Middleware ─────────────────────────────────────── */

/**
 * Next.js middleware — enforces authentication, rate limiting, CSRF protection,
 * and security headers on all routes.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  ensureCleanup();

  // ── Security headers (applied to ALL responses) ──
  const response = NextResponse.next();
  applySecurityHeaders(response);

  // ── API route handling ──
  if (pathname.startsWith("/api/")) {
    const ipKey = getIpKey(request);
    const isAuthPath = pathname.startsWith("/api/auth");

    // ── Rate limiting (all API routes including public) ──
    const limit = isAuthPath ? AUTH_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;
    const rateLimitKey = `${ipKey}:${isAuthPath ? "auth" : "api"}`;
    if (!checkRateLimit(rateLimitKey, limit)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429 }
      );
    }

    // ── Allow public auth paths (after rate limiting) ──
    if (isAuthPath) {
      return response;
    }

    // ── Body size check for state-changing requests ──
    if (STATE_CHANGING_METHODS.has(request.method)) {
      const contentLength = request.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE_BYTES) {
        return NextResponse.json(
          { error: "Request body too large. Maximum 1 MB." },
          { status: 413 }
        );
      }
    }

    // ── CSRF protection for state-changing requests ──
    if (STATE_CHANGING_METHODS.has(request.method) && !verifyCsrf(request)) {
      return NextResponse.json(
        { error: "Forbidden — invalid request origin." },
        { status: 403 }
      );
    }

    // ── Authentication — all non-auth API routes require a valid JWT ──
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return response;
  }

  // ── Page route protection ──
  if (PUBLIC_PAGE_PATHS.has(pathname)) {
    return response;
  }

  // Protected pages — redirect to login if no session
  const token = await getToken({ req: request });
  if (!token) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

/* ─── Matcher ───────────────────────────────────────── */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
