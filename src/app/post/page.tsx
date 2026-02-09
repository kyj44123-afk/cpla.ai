"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { PaymentModal } from "@/components/post/PaymentModal";

export default function PostJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setShowPaymentModal(true);
  }

  async function confirmPayment() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim() || null,
          budget: budget.trim() || null,
          deadline: deadline.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "등록에 실패했습니다.");
        setLoading(false);
        return;
      }
      setShowPaymentModal(false);
      router.push(`/project/${json.id}`);
      router.refresh();
    } catch {
      setError("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">← 대시보드</Link>
        </Button>
      </div>
      <h1 className="text-xl font-semibold text-foreground">협업 의뢰 등록</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        등록 시 포인트가 차감되거나 결제가 필요합니다. (PortOne 연동 예정)
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
            placeholder="의뢰 제목"
            required
          />
        </div>
        <div>
          <Label htmlFor="content">내용</Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-2 min-h-[200px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="의뢰 내용"
            rows={8}
          />
        </div>
        <div>
          <Label htmlFor="budget">예산</Label>
          <Input
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="mt-2"
            placeholder="예: 100만원"
          />
        </div>
        <div>
          <Label htmlFor="deadline">마감일</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-2"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            등록하기
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">취소</Link>
          </Button>
        </div>
      </form>

      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onConfirm={confirmPayment}
        loading={loading}
        title="공고 등록비 결제"
        description="포인트를 차감하거나 결제를 진행합니다. (UI만 구현, PortOne 연동 예정)"
      />
    </div>
  );
}
