import { NextResponse } from "next/server";
import { getNationalLawApiKey } from "@/lib/settings";

const LAW_API_BASE = "https://www.law.go.kr/DRF/lawService.do";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  const id = searchParams.get("id");

  if (!target || !id || (target !== "prec" && target !== "admrul")) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const apiKey = getNationalLawApiKey().trim();
  if (!apiKey) {
    return NextResponse.json({ error: "국가법령정보센터 OC가 설정되지 않았습니다." }, { status: 400 });
  }

  const redirectUrl = new URL(LAW_API_BASE);
  redirectUrl.searchParams.set("OC", apiKey);
  redirectUrl.searchParams.set("target", target);
  redirectUrl.searchParams.set("ID", id);
  redirectUrl.searchParams.set("type", "HTML");

  return NextResponse.redirect(redirectUrl.toString());
}
