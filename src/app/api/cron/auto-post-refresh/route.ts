import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  generateAutoPostMarkdown,
  generateDailyAutoPostTitles,
  shouldRefreshAutoPost,
} from "@/lib/autoPostGenerator";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: author } = await admin
      .from("profiles")
      .select("id")
      .eq("verification_status", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: fallbackAuthor } = !author
      ? await admin.from("profiles").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle()
      : { data: null };

    const authorId = author?.id ?? fallbackAuthor?.id ?? null;
    if (!authorId) {
      return NextResponse.json({ error: "No author profile found" }, { status: 400 });
    }

    const todayKst = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
    const titles = await generateDailyAutoPostTitles(1);

    let created = 0;
    for (const rawTitle of titles) {
      const title = rawTitle.includes(todayKst) ? rawTitle : `${todayKst} | ${rawTitle}`;
      const content = await generateAutoPostMarkdown(title);
      const { error: insertError } = await admin.from("posts").insert({
        author_id: authorId,
        title,
        content,
        status: "open",
      });
      if (!insertError) created += 1;
    }

    const { data: posts, error } = await admin
      .from("posts")
      .select("id, title, content, updated_at, status")
      .eq("status", "open")
      .order("updated_at", { ascending: true })
      .limit(30);

    if (error || !posts) {
      return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
    }

    let refreshed = 0;
    let skipped = 0;

    for (const post of posts) {
      if (!shouldRefreshAutoPost(post.updated_at, 24) && post.content) {
        skipped += 1;
        continue;
      }
      const markdown = await generateAutoPostMarkdown(String(post.title || ""));
      const { error: updateError } = await admin.from("posts").update({ content: markdown }).eq("id", post.id);
      if (!updateError) {
        refreshed += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      total: posts.length,
      created,
      refreshed,
      skipped,
      ranAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
