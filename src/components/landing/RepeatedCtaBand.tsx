"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RepeatedCtaBandProps = {
  enableStickyMobile?: boolean;
};

export default function RepeatedCtaBand({ enableStickyMobile = true }: RepeatedCtaBandProps) {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    if (!enableStickyMobile) return;

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScrollable <= 0) {
        setShowSticky(false);
        return;
      }

      const progress = scrollTop / maxScrollable;
      setShowSticky(progress >= 0.4);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enableStickyMobile]);

  return (
    <>
      <section
        aria-labelledby="repeated-cta-title"
        className="mt-16 rounded-3xl border border-slate-200 bg-slate-950 px-5 py-7 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.6)] md:px-8 md:py-8"
      >
        <p id="repeated-cta-title" className="text-center text-base font-semibold text-white md:text-lg">
          어떤 고객이신가요? 맞는 흐름으로 바로 안내합니다.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <Link
            href="#enterprise"
            aria-label="기업용 솔루션 보기 섹션으로 이동"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-center transition hover:bg-slate-100"
          >
            <span className="block text-sm font-semibold text-slate-900">기업용 솔루션 보기</span>
            <span className="mt-1 block text-xs text-slate-600">2분 설명 → 맞춤 진단 흐름 안내</span>
          </Link>

          <Link
            href="#worker"
            aria-label="근로자 프리랜서용 보기 섹션으로 이동"
            className="rounded-2xl border border-slate-300 bg-slate-900 px-4 py-3.5 text-center transition hover:border-slate-100 hover:bg-slate-800"
          >
            <span className="block text-sm font-semibold text-slate-50">근로자·프리랜서용 보기</span>
            <span className="mt-1 block text-xs text-slate-300">1분 체크 → 필요한 다음 단계 안내</span>
          </Link>
        </div>
      </section>

      {enableStickyMobile && (
        <div
          aria-hidden={!showSticky}
          className={`fixed inset-x-0 bottom-0 z-50 border-t border-slate-300 bg-white/95 p-3 shadow-[0_-10px_24px_-14px_rgba(15,23,42,0.55)] backdrop-blur md:hidden transition-transform duration-300 ${
            showSticky ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <p className="mb-2 text-center text-xs font-medium text-slate-700">어떤 고객이신가요?</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="#enterprise"
              aria-label="기업용 솔루션 보기 섹션으로 이동"
              className="rounded-lg bg-slate-900 px-3 py-2.5 text-center text-xs font-semibold text-white"
            >
              기업용 솔루션 보기
              <span className="mt-1 block text-[10px] font-medium text-slate-300">2분 설명 → 맞춤 진단</span>
            </Link>
            <Link
              href="#worker"
              aria-label="근로자 프리랜서용 보기 섹션으로 이동"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-900"
            >
              근로자·프리랜서용 보기
              <span className="mt-1 block text-[10px] font-medium text-slate-500">1분 체크 → 다음 단계</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
