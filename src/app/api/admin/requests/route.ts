import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("requests")
    .select("id,type,data,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load requests", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ rows: data ?? [] });
}

