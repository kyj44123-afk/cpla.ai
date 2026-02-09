"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { PostWithAuthor } from "@/types/database";

const ROLE_LABEL: Record<string, string> = {
  lawyer: "변호사",
  labor_attorney: "노무사",
  tax_accountant: "세무사",
  patent_attorney: "변리사",
  other: "기타",
};

function PostPreviewCard({ post }: { post: PostWithAuthor }) {
  const authorLabel = post.author
    ? ROLE_LABEL[post.author.role] ?? post.author.full_name ?? "익명"
    : "익명";

  return (
    <Link
      href={`/project/${post.id}`}
      className="block rounded-lg border border-border bg-card p-4 text-card-foreground transition hover:border-primary/30 hover:shadow-sm"
    >
      <h3 className="font-medium text-foreground line-clamp-1">{post.title}</h3>
      {post.budget && (
        <p className="mt-1 text-sm text-muted-foreground">예산: {post.budget}</p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {authorLabel}
        <span className="mx-1.5">·</span>
        {new Date(post.created_at).toLocaleDateString("ko-KR")}
      </p>
    </Link>
  );
}

export function LatestPostsPreview() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch {
        setError(
          "Supabase 환경 변수가 없습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해 주세요."
        );
        setLoading(false);
        return;
      }

      const { data, error: e } = await supabase
        .from("posts")
        .select(
          `
          id,
          title,
          content,
          budget,
          deadline,
          status,
          created_at,
          author:profiles!author_id(id, full_name, role, office_location)
        `
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);

      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      setPosts((data as unknown as PostWithAuthor[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-50/50 p-4 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
        {error}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
        아직 등록된 의뢰가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostPreviewCard key={post.id} post={post} />
        ))}
      </div>
      <p className="text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary underline underline-offset-2 hover:no-underline"
        >
          전체 의뢰 보기 →
        </Link>
      </p>
    </div>
  );
}
