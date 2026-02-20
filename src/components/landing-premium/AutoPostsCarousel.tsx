"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AutoPostItem = {
  id: string;
  title: string;
  excerpt: string;
  createdAt: string;
};

type AutoPostsCarouselProps = {
  posts?: AutoPostItem[];
};

const FALLBACK_POSTS: AutoPostItem[] = [
  {
    id: "fallback-1",
    title: "근로계약 체결 단계에서 가장 많이 놓치는 5가지",
    excerpt: "신규 입사 시점에 발생하는 분쟁 리스크를 예방하기 위한 필수 점검 항목을 정리했습니다.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "직장 내 괴롭힘 대응 프로세스, 어디서부터 시작해야 할까",
    excerpt: "신고 접수부터 조사, 사후조치까지 기업이 지켜야 할 실무 절차를 단계별로 안내합니다.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "임금체계 개편 전 반드시 확인해야 할 법적 체크리스트",
    excerpt: "임금체계/통상임금/퇴직금 이슈를 한 번에 점검할 수 있는 실무형 기준을 제공합니다.",
    createdAt: new Date().toISOString(),
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AutoPostsCarousel({ posts = FALLBACK_POSTS }: AutoPostsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [items, setItems] = useState<AutoPostItem[]>(posts.length > 0 ? posts : FALLBACK_POSTS);

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
        const mapped = data.slice(0, 12).map((row) => {
          const content = String(row.content ?? "");
          const plain = content.replace(/[#>*`[\]()_-]/g, " ").replace(/\s+/g, " ").trim();
          return {
            id: String(row.id),
            title: String(row.title ?? "제목 없음"),
            excerpt: plain.slice(0, 130) || "자동 발행된 포스트 본문입니다.",
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
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1200) {
        setVisibleCount(2);
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
    const width = 100 / visibleCount;
    return {
      width: `${(items.length * 100) / visibleCount}%`,
      transform: `translateX(-${index * width}%)`,
    };
  }, [index, items.length, visibleCount]);

  return (
    <section className="bg-white px-5 py-20 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Auto Posts</p>
            <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-5xl">AI가 자동 발행하는 포스트</h2>
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
              <article key={post.id} className="px-2.5" style={{ width: `${100 / items.length}%` }}>
                <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-6 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.6)]">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{formatDate(post.createdAt)}</p>
                  <h3 className="mt-3 line-clamp-2 font-serif text-2xl leading-snug text-slate-900">{post.title}</h3>
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
                  <Link
                    href={post.id.startsWith("fallback-") ? "/enterprise-diagnosis" : `/posts/${post.id}`}
                    className="mt-6 inline-flex w-fit items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    자세히 보기
                  </Link>
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
    </section>
  );
}
