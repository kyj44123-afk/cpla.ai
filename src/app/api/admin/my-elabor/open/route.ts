import { NextResponse } from "next/server";

import { getNationalLawApiKey } from "@/lib/settings";

const LAW_API_BASE = "https://www.law.go.kr/DRF/lawService.do";
const SAFE_ID_PATTERN = /^[A-Za-z0-9_-]{1,120}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const id = searchParams.get("id");

  if (!target || !id || (target !== "prec" && target !== "admrul")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!SAFE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const apiKey = getNationalLawApiKey().trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Law API key not configured" }, { status: 400 });
  }

  const redirectUrl = new URL(LAW_API_BASE);
  redirectUrl.searchParams.set("OC", apiKey);
  redirectUrl.searchParams.set("target", target);
  redirectUrl.searchParams.set("ID", id);
  redirectUrl.searchParams.set("type", "HTML");

  if (redirectUrl.protocol !== "https:" || redirectUrl.hostname !== "www.law.go.kr") {
    return NextResponse.json({ error: "Blocked target host" }, { status: 400 });
  }

  return NextResponse.redirect(redirectUrl.toString());
}