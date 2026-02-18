import { NextResponse } from "next/server";

import { withSecurity } from "@/lib/api-security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 20, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  const supabase = getSupabaseAdmin();
  const { id } = await params;

  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}