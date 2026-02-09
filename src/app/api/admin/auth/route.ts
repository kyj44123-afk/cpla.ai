import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "cpla2024admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const password = body.password?.trim();

        if (password === ADMIN_PASSWORD) {
            // 쿠키 설정
            const cookieStore = await cookies();
            cookieStore.set("admin_session", "authenticated", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                maxAge: 60 * 60 * 24, // 24시간
                path: "/",
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
    } catch (error) {
        console.error("Auth error:", error);
        return NextResponse.json({ success: false, error: "Auth error" }, { status: 500 });
    }
}
