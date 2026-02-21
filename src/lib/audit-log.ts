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

  const logEntry = {
    ts: now,
    ip,
    ua: userAgent,
    path: pathname,
    ...event,
  };

  // Always log to console (immediate visibility)
  console.info(JSON.stringify(logEntry));

  // Persist to DB (fire-and-forget, don't block the request)
  persistAuditLog(logEntry).catch(() => {
    // Silently fail — console log above is the fallback
  });
}

async function persistAuditLog(entry: Record<string, unknown>): Promise<void> {
  try {
    const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
    const supabase = getSupabaseAdmin();
    await supabase.from("audit_logs").insert({
      timestamp: entry.ts,
      ip: entry.ip,
      user_agent: entry.ua,
      path: entry.path,
      category: entry.category,
      action: entry.action,
      success: entry.success,
      subject: entry.subject || null,
      tenant: entry.tenant || null,
      details: entry.details || {},
    });
  } catch {
    // DB not available — that's fine, console log is the fallback
  }
}
