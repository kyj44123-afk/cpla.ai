"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AutoPostItem = {
  id: string;
  title: string;
  excerpt: string;
  fullContent: string;
  createdAt: string;
};

type AutoPostsCarouselProps = {
  posts?: AutoPostItem[];
};

const FALLBACK_POSTS: AutoPostItem[] = [
  {
    id: "fallback-1",
    title: "근로계약 체결 단계에서 자주 놓치는 5가지",
    excerpt: "채용 직후 분쟁을 줄이기 위해 계약서에서 반드시 확인해야 할 핵심 항목을 정리했습니다.",
    fullContent: "# 근로계약 체결 단계에서 자주 놓치는 5가지\n\n현재는 샘플 포스트입니다.\n실제 자동 포스트가 생성되면 이 영역에 본문이 표시됩니다.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "직장 내 괴롭힘 조사 프로세스 실무 체크",
    excerpt: "신고 접수부터 조사, 후속 조치까지 기업이 지켜야 할 절차를 단계별로 안내합니다.",
    fullContent: "# 직장 내 괴롭힘 조사 프로세스 실무 체크\n\n현재는 샘플 포스트입니다.\n실제 자동 포스트가 생성되면 이 영역에 본문이 표시됩니다.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "임금체계 개편 전 확인해야 할 법적 체크리스트",
    excerpt: "통상임금, 수당, 퇴직금 이슈를 사전에 점검해 리스크를 줄이는 방법을 다룹니다.",
    fullContent: "# 임금체계 개편 전 확인해야 할 법적 체크리스트\n\n현재는 샘플 포스트입니다.\n실제 자동 포스트가 생성되면 이 영역에 본문이 표시됩니다.",
    createdAt: new Date().toISOString(),
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function isCorruptedText(text: string) {
  if (!text) return true;
  const normalized = text.trim();
  if (!normalized) return true;

  const questionRatio = ((normalized.match(/\?/g) || []).length || 0) / normalized.length;
  const hangulRatio = ((normalized.match(/[가-힣]/g) || []).length || 0) / normalized.length;
  const hanRatio = ((normalized.match(/[\u4E00-\u9FFF]/g) || []).length || 0) / normalized.length;

  if (questionRatio > 0.2) return true;
  if (hangulRatio < 0.08 && hanRatio > 0.2) return true;

  return false;
}

function sanitizeText(text: string, fallback: string) {
  return isCorruptedText(text) ? fallback : text;
}

/* ---------- Simple Markdown-like renderer ---------- */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (trimmed.startsWith("### ")) {
          return <h4 key={i} className="mt-4 mb-1 text-base font-bold text-slate-800">{trimmed.slice(4)}</h4>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={i} className="mt-5 mb-1 text-lg font-bold text-slate-900">{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith("# ")) {
          return <h2 key={i} className="mt-5 mb-2 text-xl font-bold text-slate-900">{trimmed.slice(2)}</h2>;
        }

        if (!trimmed) {
          return <div key={i} className="h-2" />;
        }

        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}

export default function AutoPostsCarousel({ posts = FALLBACK_POSTS }: AutoPostsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [items, setItems] = useState<AutoPostItem[]>(posts.length > 0 ? posts : FALLBACK_POSTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedContent, setSelectedContent] = useState("");
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/posts", { cache: "no-store" });
        if (!res.ok) return;

        const data = (await res.json()) as Array<{
          id: string;
          title: string;
          content: string | null;
          created_at: string;
        }>;

        if (!Array.isArray(data) || data.length === 0) return;

        const mapped = data.slice(0, 12).map((row, rowIndex) => {
          const content = String(row.content ?? "");
          const plain = content.replace(/[#>*`[\]()_-]/g, " ").replace(/\s+/g, " ").trim();

          return {
            id: String(row.id),
            title: sanitizeText(String(row.title ?? ""), `제목 확인 중 (${rowIndex + 1})`),
            excerpt: sanitizeText(plain.slice(0, 130), "본문 인코딩을 확인 중입니다."),
            fullContent: content,
            createdAt: String(row.created_at ?? ""),
          };
        });

        if (mapped.length > 0) {
          setItems(mapped);
        }
      } catch {
        // Keep fallback cards.
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 1024) {
        setVisibleCount(1);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const maxIndex = Math.max(items.length - visibleCount, 0);
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const trackStyle = useMemo(() => {
    const step = items.length > 0 ? 100 / items.length : 0;
    return {
      width: `${(items.length * 100) / visibleCount}%`,
      transform: `translateX(-${index * step}%)`,
    };
  }, [index, items.length, visibleCount]);

  const openPostModal = async (post: AutoPostItem) => {
    setModalOpen(true);
    setSelectedTitle(post.title);
    setSelectedContent("");
    setLoadError("");

    // Use the full content already fetched with the list — no extra API call needed
    if (post.fullContent && post.fullContent.trim().length > 0) {
      setSelectedTitle(sanitizeText(post.title, "제목 인코딩 확인 중"));
      setSelectedContent(
        sanitizeText(post.fullContent, "본문 데이터 인코딩에 문제가 있어 내용을 표시할 수 없습니다."),
      );
      return;
    }

    // Fallback: fetch from dedicated API only if content was missing from the list
    setLoadingPost(true);
    try {
      const res = await fetch(`/api/auto-posts/${post.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "포스트를 불러오지 못했습니다.");

      const fetchedTitle = String(data.title ?? post.title);
      const fetchedContent = String(data.content ?? "");

      setSelectedTitle(sanitizeText(fetchedTitle, "제목 인코딩 확인 중"));
      setSelectedContent(
        sanitizeText(
          fetchedContent,
          "본문 데이터 인코딩에 문제가 있어 내용을 표시할 수 없습니다. 관리자에서 원본 데이터를 확인해주세요.",
        ),
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "포스트 로드 중 오류가 발생했습니다.";
      setLoadError(msg);
    } finally {
      setLoadingPost(false);
    }
  };

  return (
    <section className="bg-white px-5 py-20 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">DIRECTOR&apos;S PICK</p>
            <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-5xl">Today&apos;s HR Insight</h2>
          </div>
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
              disabled={!canPrev}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="이전 포스트 보기"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setIndex((prev) => Math.min(prev + 1, maxIndex))}
              disabled={!canNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="다음 포스트 보기"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-hidden">
          <div className="flex transition-transform duration-300 ease-out" style={trackStyle}>
            {items.map((post) => (
              <article
                key={post.id}
                className="px-0 md:px-2.5"
                style={{ width: `${100 / items.length}%` }}
              >
                <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-6 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.6)]">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{formatDate(post.createdAt)}</p>
                  <h3 className="mt-3 line-clamp-2 font-serif text-2xl leading-snug text-slate-900">{post.title}</h3>
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                  <button
                    type="button"
                    onClick={() => openPostModal(post)}
                    className="mt-6 inline-flex w-fit items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    자세히 보기
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setIndex((prev) => Math.max(prev - 1, 0))}
            disabled={!canPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="이전 포스트 보기"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => Math.min(prev + 1, maxIndex))}
            disabled={!canNext}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="다음 포스트 보기"
          >
            →
          </button>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="!max-w-3xl max-h-[88vh] overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle className="font-serif text-2xl text-slate-900">{selectedTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {loadingPost ? <p className="text-sm text-slate-600">포스트를 불러오는 중입니다...</p> : null}
            {!loadingPost && loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
            {!loadingPost && !loadError && selectedContent ? (
              <MarkdownContent content={selectedContent} />
            ) : null}
          </div>
          <div className="border-t border-slate-200 px-6 py-4">
            <Link
              href="/counseling"
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              상담 예약
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
