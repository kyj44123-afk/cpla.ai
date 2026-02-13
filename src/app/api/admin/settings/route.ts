import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        { error: "관리자 설정 API는 비활성화되었습니다." },
        { status: 410 }
    );
}

export async function POST() {
    return NextResponse.json(
        { error: "관리자 설정 API는 비활성화되었습니다." },
        { status: 410 }
    );
}
