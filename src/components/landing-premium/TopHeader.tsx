"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const SCROLLED_THRESHOLD = 32;
const MENU_ITEMS = [
  { href: "/advisory", label: "자문" },
  { href: "/diagnosis", label: "진단" },
  { href: "/consulting", label: "컨설팅" },
  { href: "/harassment", label: "괴롭힘·성희롱" },
  { href: "/training", label: "교육" },
];

export default function TopHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > SCROLLED_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const useSolidTheme = pathname !== "/" || isScrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        useSolidTheme
          ? "border-b border-slate-200/80 bg-white/95 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 md:h-20 md:px-8">
        <Link
          href="/"
          className={`shrink-0 text-sm font-semibold tracking-[0.12em] transition-colors md:text-base ${
            useSolidTheme ? "text-slate-900" : "text-white"
          }`}
        >
          CPLA+AI
        </Link>

        <nav
          aria-label="주요 메뉴"
          className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto whitespace-nowrap text-xs md:gap-3 md:text-sm"
        >
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : useSolidTheme
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-white/90 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/counseling"
          className="hidden shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 md:inline-flex"
        >
          상담 예약
        </Link>
      </div>
    </header>
  );
}
