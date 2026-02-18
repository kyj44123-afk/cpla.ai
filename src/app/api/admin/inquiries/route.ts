import { NextResponse } from "next/server";

import { withSecurity } from "@/lib/api-security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 30, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .eq("type", "contact_submission")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const inquiries = (data || []).map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      name: item.data?.name || undefined,
      contact: item.data?.contact || "N/A",
      query: item.data?.initial_query || "",
      session_id: item.session_id,
      status: item.data?.status || "new",
    }));

    return NextResponse.json(inquiries);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}