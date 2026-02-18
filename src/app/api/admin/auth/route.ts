import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

import { writeAuditLog } from "@/lib/audit-log";
import { createCsrfToken, signAdminSession } from "@/lib/security-core";

const SESSION_MAX_AGE = 60 * 60 * 8;

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { password?: string; tenant?: string };
    const password = String(body.password || "").trim();
    const tenant = String(body.tenant || "default").trim() || "default";

    if (!password) {
      writeAuditLog(req, {
        category: "auth",
        action: "admin_login_failed",
        success: false,
        tenant,
        details: { reason: "missing_password" },
      });
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const adminPassword = String(process.env.ADMIN_PASSWORD || "").trim();
    if (!adminPassword) {
      writeAuditLog(req, {
        category: "security",
        action: "admin_login_blocked",
        success: false,
        tenant,
        details: { reason: "admin_password_not_configured" },
      });
      return NextResponse.json({ success: false, error: "Server not configured" }, { status: 500 });
    }

    if (!safeCompare(password, adminPassword)) {
      writeAuditLog(req, {
        category: "auth",
        action: "admin_login_failed",
        success: false,
        tenant,
        details: { reason: "password_mismatch" },
      });
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const now = Math.floor(Date.now() / 1000);
    const csrf = createCsrfToken();
    const session = await signAdminSession({
      sub: "admin",
      role: "admin",
      tenant,
      iat: now,
      exp: now + SESSION_MAX_AGE,
      csrf,
    });

    const cookieStore = await cookies();
    const secureCookie = process.env.NODE_ENV === "production";

    cookieStore.set("admin_session", session, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    cookieStore.set("admin_csrf", csrf, {
      httpOnly: false,
      secure: secureCookie,
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    writeAuditLog(req, {
      category: "auth",
      action: "admin_login_success",
      success: true,
      subject: "admin",
      tenant,
    });

    return NextResponse.json({ success: true, tenant });
  } catch {
    writeAuditLog(req, {
      category: "security",
      action: "admin_login_error",
      success: false,
    });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
