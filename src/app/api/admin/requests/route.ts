import { NextResponse } from "next/server";

import { withSecurity } from "@/lib/api-security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 30, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("requests")
    .select("id,type,data,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }

  return NextResponse.json({ rows: data ?? [] });
}