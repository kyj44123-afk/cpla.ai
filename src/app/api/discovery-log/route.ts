import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIpFromHeaders } from "@/lib/security-core";
import { checkRateLimit } from "@/lib/api-security";

const BodySchema = z.object({
  sessionId: z.string().uuid(),
  step: z.number().int().min(1).max(10),
  eventType: z.string().trim().min(1).max(100),
  audience: z.enum(["worker", "employer"]).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIpFromHeaders(new Headers(req.headers));
    if (!checkRateLimit(`discovery-log:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("discovery_step_logs").insert({
      session_id: parsed.data.sessionId,
      step: parsed.data.step,
      event_type: parsed.data.eventType,
      audience: parsed.data.audience || null,
      payload: parsed.data.payload || {},
    });

    if (error) {
      return NextResponse.json({ error: "Failed to store discovery log" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}