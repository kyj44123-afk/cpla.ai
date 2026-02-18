import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeText } from "@/lib/security-core";

const ContactSchema = z.object({
  contact: z.string().trim().min(2).max(120),
  name: z.string().trim().max(60).optional().default(""),
  query: z.string().trim().max(4000).optional().default(""),
  sessionId: z.string().uuid().optional(),
  selectedService: z.string().trim().max(200).optional(),
  selectedPath: z.array(z.string().trim().max(200)).max(20).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = ContactSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { contact, name, query, sessionId, selectedService, selectedPath } = parsed.data;

    const supabase = getSupabaseAdmin();
    let targetSessionId = sessionId;

    if (!targetSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({})
        .select("id")
        .single();

      if (sessionError || !session) {
        throw new Error("session_create_failed");
      }
      targetSessionId = session.id;
    }

    const { error: requestError } = await supabase.from("requests").insert({
      type: "contact_submission",
      data: {
        contact: sanitizeText(contact, 120),
        name: sanitizeText(name, 60),
        initial_query: sanitizeText(query, 4000),
        selected_service: selectedService ? sanitizeText(selectedService, 200) : null,
        selected_path: Array.isArray(selectedPath) ? selectedPath.map((item) => sanitizeText(item, 200)) : [],
      },
      session_id: targetSessionId,
    });

    if (requestError) {
      throw new Error("request_insert_failed");
    }

    await supabase.from("discovery_step_logs").insert({
      session_id: targetSessionId,
      step: 5,
      event_type: "contact_submitted",
      payload: {
        name: sanitizeText(name, 60),
        contact: sanitizeText(contact, 120),
        selected_service: selectedService ? sanitizeText(selectedService, 200) : null,
        selected_path: Array.isArray(selectedPath) ? selectedPath.map((item) => sanitizeText(item, 200)) : [],
      },
    });

    return NextResponse.json({ sessionId: targetSessionId, success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}