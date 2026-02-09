import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type RequestType =
  | "personal_call"
  | "personal_quote"
  | "biz_call"
  | "biz_quote"
  | "biz_brochure";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body as { type?: RequestType; data?: unknown };
  if (!type || !data) {
    return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
  }

  const allowed: RequestType[] = [
    "personal_call",
    "personal_quote",
    "biz_call",
    "biz_quote",
    "biz_brochure",
  ];
  if (!allowed.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const ua = req.headers.get("user-agent") ?? null;

  const { error } = await supabase.from("requests").insert({
    type,
    data,
    ip,
    user_agent: ua,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save request", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

