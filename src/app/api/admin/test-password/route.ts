import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const envPassword = process.env.ADMIN_PASSWORD;
  const defaultPassword = "admin123";
  const actualPassword = envPassword || defaultPassword;

  return NextResponse.json({
    hasEnvPassword: Boolean(envPassword),
    expectedLength: actualPassword.length,
    firstChar: actualPassword[0],
    lastChar: actualPassword[actualPassword.length - 1],
    hint: envPassword
      ? "환경변수 ADMIN_PASSWORD가 설정되어 있습니다"
      : "기본 비밀번호(admin123)를 사용 중입니다",
    // 보안상 실제 값은 노출하지 않음
  });
}
