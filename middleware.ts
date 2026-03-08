// Copyright (c) Said Borna. All rights reserved.
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/* ─── Constants ─────────────────────────────────────── */

/** API routes that do NOT require authentication. */
const PUBLIC_API_PATHS = new Set([
  "/api/auth",
]);

/** Page routes that are public (no redirect to login). */
const PUBLIC_PAGE_PATHS = new Set([
  "/login",
  "/signup",
  "/",
]);

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

/* ─── Middleware ─────────────────────────────────────── */

/**
 * Next.js middleware — enforces authentication on all /api/* and /app/* routes.
 * Public paths (auth, login, signup) are exempt.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── Security headers (applied to ALL responses) ──
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // ── API route protection ──
  if (pathname.startsWith("/api/")) {
    // Allow public API paths (auth callbacks)
    for (const publicPath of PUBLIC_API_PATHS) {
      if (pathname.startsWith(publicPath)) {
        return response;
      }
    }

    // All other API routes require a valid JWT
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
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
