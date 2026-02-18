import type { NextRequest } from "next/server";

export type AuditEvent = {
  category: "auth" | "access" | "data" | "security";
  action: string;
  success: boolean;
  subject?: string;
  tenant?: string;
  details?: Record<string, unknown>;
};

export function writeAuditLog(req: Request | NextRequest, event: AuditEvent): void {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfIp = req.headers.get("cf-connecting-ip");
  const ip = (forwarded?.split(",")[0]?.trim() || realIp || cfIp || "local").trim();
  const userAgent = req.headers.get("user-agent") || "unknown";
  const now = new Date().toISOString();
  const pathname = new URL(req.url).pathname;

  console.info(
    JSON.stringify({
      ts: now,
      ip,
      ua: userAgent,
      path: pathname,
      ...event,
    })
  );
}
