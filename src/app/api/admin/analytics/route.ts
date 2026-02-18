import { NextResponse } from "next/server";

import { withSecurity } from "@/lib/api-security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 20, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const supabase = getSupabaseAdmin();

    const { data: contacts } = await supabase
      .from("requests")
      .select("id, data, created_at")
      .eq("type", "contact_submission")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: sessions } = await supabase
      .from("chat_sessions")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    const sessionsWithMessages = await Promise.all(
      (sessions || []).map(async (session) => {
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true });
        return { ...session, messages: messages || [] };
      })
    );

    return NextResponse.json({
      contacts: contacts || [],
      sessions: sessionsWithMessages,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}