import { NextResponse } from "next/server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIpFromHeaders } from "@/lib/security-core";
import { checkRateLimit } from "@/lib/api-security";

export async function POST(req: Request) {
  try {
    const ip = getClientIpFromHeaders(new Headers(req.headers));
    if (!checkRateLimit(`session:${ip}`, 30, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = getSupabaseAdmin();

    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({})
      .select("id")
      .single();

    if (error || !session) {
      throw new Error("session_create_failed");
    }

    return NextResponse.json({ sessionId: session.id });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}