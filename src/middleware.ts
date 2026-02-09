import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 경로 보호 (login 페이지와 auth API 제외)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // 로그인 페이지와 인증 API는 예외 처리
    if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
      return NextResponse.next();
    }

    // 세션 쿠키 체크
    const session = request.cookies.get("admin_session");
    if (!session || session.value !== "authenticated") {
      // API는 401 반환
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // 페이지는 로그인으로 리다이렉트
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
