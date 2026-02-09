"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { PostWithAuthor } from "@/types/database";
import { Button } from "@/components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  lawyer: "변호사",
  labor_attorney: "노무사",
  tax_accountant: "세무사",
  patent_attorney: "변리사",
  other: "기타",
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      setError("Supabase 환경 변수를 설정해 주세요.");
      setLoading(false);
      return;
    }
    (async () => {
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
        .eq("id", id)
        .single();
      if (e || !data) {
        setError(e?.message ?? "글을 찾을 수 없습니다.");
        setLoading(false);
        return;
      }
      setPost(data as unknown as PostWithAuthor);
      setLoading(false);
    })();
  }, [id]);

  async function handleApply() {
    setApplying(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { error: e } = await supabase.from("applications").insert({
        post_id: id,
        applicant_id: user.id,
        status: "pending",
        message: null,
      });
      if (e) {
        if (e.code === "23505") {
          alert("이미 지원하셨습니다.");
        } else {
          alert(e.message);
        }
        setApplying(false);
        return;
      }
      alert("지원이 완료되었습니다. 작성자에게 알림이 전송됩니다. (트리거 연동 예정)");
    } catch {
      alert("지원에 실패했습니다.");
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-6 w-full animate-pulse rounded bg-muted" />
        <div className="mt-4 h-40 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-destructive">{error ?? "글을 찾을 수 없습니다."}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard">목록으로</Link>
        </Button>
      </div>
    );
  }

  const authorLabel = post.author
    ? ROLE_LABEL[post.author.role] ?? post.author.full_name ?? "익명"
    : "익명";

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard">← 목록</Link>
      </Button>

      <header className="mt-6 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{authorLabel}</span>
          {post.author?.office_location && <span>{post.author.office_location}</span>}
          {post.budget && <span>예산: {post.budget}</span>}
          {post.deadline && (
            <time dateTime={post.deadline}>
              마감: {new Date(post.deadline).toLocaleDateString("ko-KR")}
            </time>
          )}
          <time dateTime={post.created_at}>
            {new Date(post.created_at).toLocaleString("ko-KR")}
          </time>
        </div>
      </header>

      <div className="mt-6 whitespace-pre-wrap text-foreground">
        {post.content || "내용 없음"}
      </div>

      <footer className="mt-10 flex gap-3">
        <Button
          onClick={handleApply}
          disabled={applying || post.status !== "open"}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {applying ? "지원 중…" : "지원하기"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">목록</Link>
        </Button>
      </footer>
    </article>
  );
}
