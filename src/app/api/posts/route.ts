import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function getUserIdFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString()
    );
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("posts")
    .select("id, title, content, budget, deadline, status, created_at, author_id")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { message: "공고 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const userId = getUserIdFromAuthHeader(authHeader);
  if (!userId) {
    return NextResponse.json(
      { message: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  let body: {
    title?: string;
    content?: string | null;
    budget?: string | null;
    deadline?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "요청 본문이 올바르지 않습니다." },
      { status: 400 }
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(
      { message: "제목을 입력해 주세요." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, verification_status, points")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { message: "회원 정보를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (!profile.verification_status) {
    return NextResponse.json(
      { message: "관리자 승인 후 공고를 등록할 수 있습니다." },
      { status: 403 }
    );
  }

  const { data: post, error: postError } = await admin
    .from("posts")
    .insert({
      author_id: userId,
      title,
      content: typeof body.content === "string" ? body.content.trim() || null : null,
      budget: typeof body.budget === "string" ? body.budget.trim() || null : null,
      deadline: typeof body.deadline === "string" && body.deadline.trim() ? body.deadline.trim() : null,
      status: "open",
    })
    .select("id")
    .single();

  if (postError || !post) {
    return NextResponse.json(
      { message: "공고 등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: post.id });
}
