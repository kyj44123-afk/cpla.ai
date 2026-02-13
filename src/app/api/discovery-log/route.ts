import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  sessionId?: string;
  step?: number;
  eventType?: string;
  audience?: "worker" | "employer";
  payload?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body.sessionId || !body.step || !body.eventType) {
      return NextResponse.json({ error: "sessionId, step, eventType are required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("discovery_step_logs").insert({
      session_id: body.sessionId,
      step: body.step,
      event_type: body.eventType,
      audience: body.audience || null,
      payload: body.payload || {},
    });

    if (error) {
      console.error("discovery log insert error:", error);
      return NextResponse.json({ error: "Failed to store discovery log" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("discovery log api error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
