import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAutoPostMarkdown, shouldRefreshAutoPost } from "@/lib/autoPostGenerator";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const postId = String(id || "").trim();
  if (!postId) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: post, error } = await admin
      .from("posts")
      .select("id, title, content, updated_at, status")
      .eq("id", postId)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const needsRefresh = !post.content || shouldRefreshAutoPost(post.updated_at, 24);
    if (!needsRefresh) {
      return NextResponse.json({
        id: post.id,
        title: post.title,
        content: post.content,
        updatedAt: post.updated_at,
        regenerated: false,
      });
    }

    const markdown = await generateAutoPostMarkdown(String(post.title || ""));
    const { data: updated, error: updateError } = await admin
      .from("posts")
      .update({ content: markdown })
      .eq("id", postId)
      .select("id, title, content, updated_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({
        id: post.id,
        title: post.title,
        content: post.content || markdown,
        updatedAt: post.updated_at,
        regenerated: false,
      });
    }

    return NextResponse.json({
      id: updated.id,
      title: updated.title,
      content: updated.content,
      updatedAt: updated.updated_at,
      regenerated: true,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}
