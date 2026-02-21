import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getAllowedCorsOrigins,
  getClientIpFromHeaders,
  verifyAdminSessionToken,
} from "@/lib/security-core";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/auth", "/api/admin/login"]);
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function createContentSecurityPolicy(): string {
  const scriptPolicy =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'strict-dynamic'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  return [
    "default-src 'self'",
    scriptPolicy,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://source.unsplash.com https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Content-Security-Policy", createContentSecurityPolicy());
  return response;
}

function applyCorsHeaders(request: NextRequest, response: NextResponse): void {
  if (!request.nextUrl.pathname.startsWith("/api/")) return;

  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedCorsOrigins();
  const isAllowed =
    !origin || origin === request.nextUrl.origin || allowedOrigins.includes(origin);

  if (isAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  response.headers.set("Vary", "Origin");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, X-Tenant-Id");
  response.headers.set("Access-Control-Max-Age", "600");
}

function isLoginBruteforceBlocked(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip) ?? { count: 0, resetAt: now + 10 * 60 * 1000 };

  if (now > entry.resetAt) {
    loginAttempts.set(ip, { count: 0, resetAt: now + 10 * 60 * 1000 });
    return false;
  }

  if (entry.count >= 10) return true;

  entry.count += 1;
  loginAttempts.set(ip, entry);
  return false;
}

function failUnauthorized(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const preflight = NextResponse.json({}, { status: 204 });
    applyCorsHeaders(request, preflight);
    return applySecurityHeaders(preflight);
  }

  if (pathname === "/api/admin/auth" && request.method === "POST") {
    const ip = getClientIpFromHeaders(request.headers);
    if (isLoginBruteforceBlocked(ip)) {
      const blocked = NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
      applyCorsHeaders(request, blocked);
      return applySecurityHeaders(blocked);
    }
  }

  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) && !PUBLIC_ADMIN_PATHS.has(pathname)) {
    const token = request.cookies.get("admin_session")?.value || "";
    const claims = await verifyAdminSessionToken(token);
    if (!claims) {
      const denied = failUnauthorized(request);
      applyCorsHeaders(request, denied);
      return applySecurityHeaders(denied);
    }

    const headerTenant = request.headers.get("x-tenant-id");
    if (headerTenant && headerTenant !== claims.tenant) {
      const tenantDenied = NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
      applyCorsHeaders(request, tenantDenied);
      return applySecurityHeaders(tenantDenied);
    }

    if (pathname.startsWith("/api/admin") && UNSAFE_METHODS.has(request.method.toUpperCase())) {
      const origin = request.headers.get("origin");
      const csrfCookie = request.cookies.get("admin_csrf")?.value || "";
      const csrfHeader = request.headers.get("x-csrf-token") || "";
      const sameOrigin = Boolean(origin && origin === request.nextUrl.origin);
      const validToken = Boolean(csrfCookie && csrfHeader && csrfCookie === csrfHeader && csrfCookie === claims.csrf);

      if (!sameOrigin && !validToken) {
        const csrfDenied = NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
        applyCorsHeaders(request, csrfDenied);
        return applySecurityHeaders(csrfDenied);
      }
    }
  }

  const response = NextResponse.next();
  applyCorsHeaders(request, response);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/:path*"],
};
