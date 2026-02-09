import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// 임시: 하드코딩으로 테스트 (환경변수 문제 해결 후 제거)
const ADMIN_PASSWORD = "admin123";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body as { password?: string };

    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 });
    }

    // 단순 비교
    const trimmedPassword = password.trim();
    const isMatch = trimmedPassword === ADMIN_PASSWORD;

    console.log("[LOGIN DEBUG]", {
      received: trimmedPassword,
      receivedLength: trimmedPassword.length,
      expected: ADMIN_PASSWORD,
      expectedLength: ADMIN_PASSWORD.length,
      match: isMatch,
    });

    if (!isMatch) {
      return NextResponse.json(
        {
          error: "Invalid password",
          hint: `입력: "${trimmedPassword}" (${trimmedPassword.length}자), 기대: "${ADMIN_PASSWORD}" (${ADMIN_PASSWORD.length}자)`,
        },
        { status: 401 }
      );
    }

    // 쿠키 설정
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return NextResponse.json(
      { error: "Server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
