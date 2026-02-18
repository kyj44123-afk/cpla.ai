import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit-log";
import { getClientIpFromHeaders, verifyAdminSessionToken } from "@/lib/security-core";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(key: string, limit = 10, windowMs = 60 * 1000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 0;
    record.lastReset = now;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  rateLimitMap.set(key, record);
  return true;
}

export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session) return false;
  const claims = await verifyAdminSessionToken(session);
  return Boolean(claims);
}

function validateNoSqlMetaChars(input: unknown): boolean {
  if (typeof input === "string") {
    return !/[;$]|--|\/\*|\*\//.test(input);
  }

  if (Array.isArray(input)) {
    return input.every(validateNoSqlMetaChars);
  }

  if (input && typeof input === "object") {
    return Object.values(input as Record<string, unknown>).every(validateNoSqlMetaChars);
  }

  return true;
}

export async function validateBody<T>(
  req: Request | NextRequest,
  schema: z.Schema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await req.json();
    if (!validateNoSqlMetaChars(body)) {
      return {
        success: false,
        error: NextResponse.json({ error: "Invalid input characters" }, { status: 400 }),
      };
    }

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return {
        success: false,
        error: NextResponse.json(
          { error: "Invalid input", details: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: parsed.data };
  } catch {
    return {
      success: false,
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }
}

type SecurityOptions = {
  checkAuth?: boolean;
  rateLimit?: { limit: number; windowMs?: number };
};

export async function withSecurity(
  req: Request | NextRequest,
  options: SecurityOptions = { checkAuth: true, rateLimit: { limit: 20 } }
): Promise<NextResponse | null> {
  const headers = req.headers;
  const ip = getClientIpFromHeaders(headers);
  const path = new URL(req.url).pathname;
  const rateKey = `${ip}:${path}`;

  if (options.rateLimit) {
    const passed = checkRateLimit(rateKey, options.rateLimit.limit, options.rateLimit.windowMs);
    if (!passed) {
      writeAuditLog(req, {
        category: "security",
        action: "rate_limit_block",
        success: false,
        details: { path, ip },
      });
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  if (options.checkAuth) {
    const isAdmin = await verifyAdminSession();
    if (!isAdmin) {
      writeAuditLog(req, {
        category: "access",
        action: "admin_access_denied",
        success: false,
        details: { path, ip },
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return null;
}

export function safeServerError(): NextResponse {
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}