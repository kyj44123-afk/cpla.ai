"use client";

import Link from "next/link";
import type { PostWithAuthor } from "@/types/database";

const PROFESSION_LABEL: Record<string, string> = {
  lawyer: "변호사",
  labor_attorney: "노무사",
  tax_accountant: "세무사",
  patent_attorney: "변리사",
  other: "기타",
};

export function PostCard({ post }: { post: PostWithAuthor }) {
  const authorLabel = post.author
    ? PROFESSION_LABEL[post.author.role] ?? post.author.full_name ?? "익명"
    : "익명";

  return (
    <Link
      href={`/posts/${post.id}`}
      className="block rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm transition hover:border-primary/30 hover:shadow-md"
    >
      <h3 className="font-semibold text-foreground">{post.title}</h3>
      {post.content && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {post.content}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>{authorLabel}</span>
        {post.budget && <span>{post.budget}</span>}
        <time dateTime={post.created_at}>
          {new Date(post.created_at).toLocaleDateString("ko-KR")}
        </time>
      </div>
    </Link>
  );
}
