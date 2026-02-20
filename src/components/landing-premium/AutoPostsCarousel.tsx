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
  posts: AutoPostItem[];
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export default function AutoPostsCarousel({ posts }: AutoPostsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

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

  const maxIndex = Math.max(posts.length - visibleCount, 0);
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const trackStyle = useMemo(() => {
    const width = 100 / visibleCount;
    return {
      width: `${(posts.length * 100) / visibleCount}%`,
      transform: `translateX(-${index * width}%)`,
    };
  }, [index, posts.length, visibleCount]);

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
            {posts.map((post) => (
              <article key={post.id} className="px-2.5" style={{ width: `${100 / posts.length}%` }}>
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
