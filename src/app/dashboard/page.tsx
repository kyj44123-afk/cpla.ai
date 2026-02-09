"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { PostWithAuthor } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ROLE_LABEL: Record<string, string> = {
  lawyer: "변호사",
  labor_attorney: "노무사",
  tax_accountant: "세무사",
  patent_attorney: "변리사",
  other: "기타",
};

export default function DashboardPage() {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterBudget, setFilterBudget] = useState("");

  useEffect(() => {
    const init = async () => {
      let supabase;
      try {
        supabase = createSupabaseBrowserClient();
      } catch {
        setLoading(false);
        return;
      }
      const { data } = await supabase
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
        .limit(50);
      let list = (data as unknown as PostWithAuthor[]) ?? [];
      if (filterRegion) {
        list = list.filter((p) =>
          p.author?.office_location?.toLowerCase().includes(filterRegion.toLowerCase())
        );
      }
      if (filterRole) {
        list = list.filter((p) => p.author?.role === filterRole);
      }
      if (filterBudget) {
        list = list.filter((p) => p.budget?.toLowerCase().includes(filterBudget.toLowerCase()));
      }
      setPosts(list);
      setLoading(false);
    };
    init();
  }, [filterRegion, filterRole, filterBudget]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground">협업 공고</h1>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/post">공고 등록</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">지역</span>
          <Input
            placeholder="예: 서울"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="h-8 w-32 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">전문직</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">전체</option>
            {Object.entries(ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">보수</span>
          <Input
            placeholder="예: 100"
            value={filterBudget}
            onChange={(e) => setFilterBudget(e.target.value)}
            className="h-8 w-28 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-muted/50" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-border bg-muted/30 py-12 text-center text-sm text-muted-foreground">
          조건에 맞는 공고가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/project/${post.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm"
              >
                <h3 className="font-medium text-foreground">{post.title}</h3>
                {post.budget && (
                  <p className="mt-1 text-sm text-muted-foreground">예산: {post.budget}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {post.author ? ROLE_LABEL[post.author.role] ?? post.author.full_name ?? "익명" : "익명"}
                  {post.author?.office_location && ` · ${post.author.office_location}`}
                  <span className="ml-1.5">{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
