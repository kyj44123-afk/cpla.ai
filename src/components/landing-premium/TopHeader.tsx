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
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-center px-5 md:h-20 md:px-8">
        <nav aria-label="주요 메뉴" className="flex items-center gap-5 text-sm md:gap-8">
          <Link
            href="/#products"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            자문
          </Link>
          <Link
            href="/#products"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            진단
          </Link>
          <Link
            href="/#products"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            컨설팅
          </Link>
          <Link
            href="/#products"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            괴롭힘·성희롱
          </Link>
          <Link
            href="/#products"
            className={`transition-colors hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
              isScrolled ? "text-slate-700" : "text-white/90"
            }`}
          >
            교육
          </Link>
        </nav>
      </div>
    </header>
  );
}
