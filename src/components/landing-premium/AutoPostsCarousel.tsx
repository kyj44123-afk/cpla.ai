"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
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

const revealTransition = { duration: 0.7, ease: "easeOut" as const };
const revealVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const FALLBACK_POSTS: AutoPostItem[] = [
  {
    id: "fallback-1",
    title: "근로계약 체결 단계에서 자주 놓치는 5가지",
    excerpt: "채용 초기 분쟁을 줄이기 위해 반드시 확인해야 할 핵심 항목을 정리했습니다.",
    fullContent: "# 근로계약 체결 단계에서 자주 놓치는 5가지\n\n현재는 샘플 포스트입니다.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "직장 내 괴롭힘 조사 프로세스 실무 체크",
    excerpt: "신고 접수부터 조사, 후속 조치까지 기업이 지켜야 할 절차를 안내합니다.",
    fullContent: "# 직장 내 괴롭힘 조사 프로세스 실무 체크\n\n현재는 샘플 포스트입니다.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "임금체계 개편 전 확인해야 할 법적 체크리스트",
    excerpt: "통상임금·수당·퇴직금 이슈를 사전에 점검해 리스크를 낮추는 방법을 다룹니다.",
    fullContent: "# 임금체계 개편 전 확인해야 할 법적 체크리스트\n\n현재는 샘플 포스트입니다.",
    createdAt: new Date().toISOString(),
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function getVisibleCount() {
  if (typeof window === "undefined") return 3;
  return window.innerWidth < 1024 ? 1 : 3;
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("# ")) {
          return (
            <h3 key={i} className="mt-4 text-lg font-bold text-slate-900">
              {trimmed.slice(2)}
            </h3>
          );
        }
        if (!trimmed) return <div key={i} className="h-2" />;
        return <p key={i}>{trimmed}</p>;
      })}
    </div>
  );
}

export default function AutoPostsCarousel({ posts = FALLBACK_POSTS }: AutoPostsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const [items, setItems] = useState<AutoPostItem[]>(posts.length > 0 ? posts : FALLBACK_POSTS);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [selectedContent, setSelectedContent] = useState("");

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

        const mapped: AutoPostItem[] = data.slice(0, 12).map((row, rowIndex) => {
          const content = String(row.content ?? "");
          const plain = content.replace(/[#>*`[\]()_-]/g, " ").replace(/\s+/g, " ").trim();
          return {
            id: String(row.id),
            title: String(row.title ?? `제목 ${rowIndex + 1}`),
            excerpt: plain.slice(0, 130) || "본문이 비어 있습니다.",
            fullContent: content || "본문이 비어 있습니다.",
            createdAt: String(row.created_at ?? ""),
          };
        });

        if (mapped.length > 0) {
          setItems(mapped);
        }
      } catch {
        // fallback 유지
      }
    };

    fetchPosts();
  }, []);

  useEffect(() => {
    const onResize = () => setVisibleCount(getVisibleCount());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const maxStart = Math.max(items.length - visibleCount, 0);
  const currentIndex = Math.min(index, maxStart);
  const visibleItems = useMemo(
    () => items.slice(currentIndex, currentIndex + visibleCount),
    [items, currentIndex, visibleCount],
  );

  const canPrev = currentIndex > 0;
  const canNext = currentIndex < maxStart;

  const openPostModal = (post: AutoPostItem) => {
    setSelectedTitle(post.title);
    setSelectedContent(post.fullContent || post.excerpt);
    setModalOpen(true);
  };

  return (
    <motion.section
      className="bg-white px-5 py-20 md:px-8 md:py-24"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={revealVariants}
      transition={revealTransition}
    >
      <div className="mx-auto w-full max-w-7xl">
        <motion.div className="flex items-end justify-between gap-4" variants={revealVariants} transition={{ duration: 0.65 }}>
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
              onClick={() => setIndex(Math.min(currentIndex + 1, maxStart))}
              disabled={!canNext}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="다음 포스트 보기"
            >
              →
            </button>
          </div>
        </motion.div>

        <motion.div
          className="mt-10 grid gap-5"
          style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}
          variants={revealVariants}
          transition={{ duration: 0.65, delay: 0.08 }}
        >
          {visibleItems.map((post) => (
            <motion.article
              key={post.id}
              className="flex h-full flex-col rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] p-6 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.6)]"
              variants={revealVariants}
              transition={{ duration: 0.5 }}
            >
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
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-5 flex justify-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setIndex(Math.max(currentIndex - 1, 0))}
            disabled={!canPrev}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="이전 포스트 보기"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setIndex(Math.min(currentIndex + 1, maxStart))}
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
            <MarkdownContent content={selectedContent} />
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
    </motion.section>
  );
}
