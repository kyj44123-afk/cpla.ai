"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SCROLLED_THRESHOLD = 32;

export default function TopHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLLED_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-slate-200/80 bg-white/95 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
        <Link
          href="/"
          className={`font-serif text-lg tracking-[0.08em] transition-colors ${
            isScrolled ? "text-slate-900" : "text-white"
          }`}
          aria-label="노무법인 호연 홈으로 이동"
        >
          노무법인 호연
        </Link>

        <nav aria-label="주요 메뉴" className="flex items-center gap-5 text-sm md:gap-8">
          <Link
            href="/counseling"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            상담안내
          </Link>
          <Link
            href="/#products"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            서비스소개
          </Link>
          <Link
            href="/chat"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            AI챗봇
          </Link>
        </nav>
      </div>
    </header>
  );
}
