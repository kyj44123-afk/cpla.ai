import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type PublishBody = {
  title?: string;
  content?: string;
  budget?: string | null;
  deadline?: string | null;
};

function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PublishBody;
    const title = normalize(body.title);
    const content = normalize(body.content);
    const budget = normalize(body.budget);
    const deadline = normalize(body.deadline);

    if (!title) {
      return NextResponse.json({ error: "발행할 제목이 없습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // posts.author_id FK를 만족시키기 위해 승인된 프로필을 우선 작성자로 사용.
    const { data: verifiedProfile, error: verifiedProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("verification_status", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (verifiedProfileError) {
      throw verifiedProfileError;
    }

    let authorId = verifiedProfile?.id ?? null;

    if (!authorId) {
      const { data: anyProfile, error: anyProfileError } = await supabase
        .from("profiles")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (anyProfileError) {
        throw anyProfileError;
      }

      authorId = anyProfile?.id ?? null;
    }

    if (!authorId) {
      return NextResponse.json(
        { error: "profiles 테이블에 작성 가능한 계정이 없습니다. 먼저 사용자 계정을 생성해주세요." },
        { status: 400 },
      );
    }

    const { data: post, error: insertError } = await supabase
      .from("posts")
      .insert({
        author_id: authorId,
        title,
        content: content || null,
        budget: budget || null,
        deadline: deadline || null,
        status: "open",
      })
      .select("id")
      .single();

    if (insertError || !post) {
      throw insertError ?? new Error("Failed to insert post");
    }

    return NextResponse.json({ id: post.id });
  } catch (error) {
    console.error("Admin blog publish error:", error);
    return NextResponse.json(
      { error: "발행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}

