import { NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIpFromHeaders, sanitizeText } from "@/lib/security-core";

export const runtime = "nodejs";

const RequestSchema = z.object({
  type: z.enum(["personal_call", "personal_quote", "biz_call", "biz_quote", "biz_brochure"]),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const ip = getClientIpFromHeaders(req.headers);
  const ua = sanitizeText(req.headers.get("user-agent") ?? "", 512) || null;

  const { error } = await supabase.from("requests").insert({
    type: parsed.data.type,
    data: parsed.data.data,
    ip,
    user_agent: ua,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}