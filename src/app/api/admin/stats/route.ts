import { NextResponse } from "next/server";

import { withSecurity } from "@/lib/api-security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type StepLog = {
  session_id: string;
  step: number;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 20, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const supabase = getSupabaseAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: sessionsCount } = await supabase.from("chat_sessions").select("*", { count: "exact", head: true });
    const { count: todaySessionsCount } = await supabase
      .from("chat_sessions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString());
    const { count: documentsCount } = await supabase.from("documents").select("*", { count: "exact", head: true });
    const { count: contactsCount } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("type", "contact_submission");

    const { data: recentSessions } = await supabase
      .from("chat_sessions")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: recentStepLogs } = await supabase
      .from("discovery_step_logs")
      .select("session_id, step, event_type, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const recentInteractions = (await Promise.all(
      (recentSessions || []).map(async (session) => {
        const { data: messages } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("session_id", session.id)
          .order("created_at", { ascending: true });

        const { data: request } = await supabase
          .from("requests")
          .select("data")
          .eq("session_id", session.id)
          .eq("type", "contact_submission")
          .single();

        if ((!messages || messages.length === 0) && !request) {
          return null;
        }

        const userMessage = messages?.find((m) => m.role === "user");
        const aiMessage = messages?.find((m) => m.role === "assistant");
        const sessionLogs = ((recentStepLogs || []) as StepLog[]).filter((log) => log.session_id === session.id);
        const step1 = sessionLogs.find((log) => log.event_type === "step1_submitted");
        const step2 = sessionLogs.find((log) => log.event_type === "step2_submitted");
        const step3 = sessionLogs.find((log) => log.event_type === "step3_submitted");

        return {
          id: session.id,
          query: userMessage?.content || (request?.data?.initial_query as string) || (step1?.payload?.input as string) || "-",
          answer:
            aiMessage?.content ||
            [step2?.payload?.answer as string, step3?.payload?.answer as string].filter(Boolean).join(" / ") ||
            "-",
          contact: (request?.data?.contact as string) || null,
          created_at: session.created_at,
        };
      })
    )).filter(Boolean);

    return NextResponse.json({
      totalSessions: sessionsCount || 0,
      todaySessions: todaySessionsCount || 0,
      totalDocuments: documentsCount || 0,
      totalContacts: contactsCount || 0,
      recentInteractions,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}