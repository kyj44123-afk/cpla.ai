"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type HeroSequenceProps = {
  introSrc: string;
  frameSources: string[];
  ctaHref: string;
  headline: string;
  subcopy: string;
};

const MOBILE_BREAKPOINT = 768;
const MAX_PRELOAD_FRAMES = 24;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function HeroSequence({
  introSrc,
  frameSources,
  ctaHref,
  headline,
  subcopy,
}: HeroSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeFrame, setActiveFrame] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const sampledFrameSources = useMemo(() => {
    if (typeof window === "undefined") return frameSources;
    const step = window.innerWidth < MOBILE_BREAKPOINT ? 2 : 1;
    return frameSources.filter((_, index) => index % step === 0);
  }, [frameSources]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setIsReducedMotion(mediaQuery.matches);
    onMotionChange();

    mediaQuery.addEventListener("change", onMotionChange);
    return () => mediaQuery.removeEventListener("change", onMotionChange);
  }, []);

  useEffect(() => {
    if (isReducedMotion) return;
    const preloadTargets = sampledFrameSources.slice(0, MAX_PRELOAD_FRAMES);
    preloadTargets.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, [sampledFrameSources, isReducedMotion]);

  useEffect(() => {
    if (isReducedMotion) return;

    const onScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollRange = sectionHeight - viewportHeight;

      if (scrollRange <= 0) return;

      const progress = clamp((window.scrollY - sectionTop) / scrollRange, 0, 1);
      const frameIndex = Math.floor(progress * Math.max(sampledFrameSources.length - 1, 0));
      setActiveFrame(frameIndex);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sampledFrameSources.length, isReducedMotion]);

  const currentBackground =
    !isReducedMotion && sampledFrameSources.length > 0
      ? sampledFrameSources[activeFrame]
      : introSrc;

  return (
    <section ref={sectionRef} className="relative h-[300vh]" aria-label="메인 비주얼">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-[background-image] duration-150"
          style={{ backgroundImage: `url("${currentBackground}")` }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(9,18,34,0.55)_12%,rgba(9,18,34,0.18)_52%,rgba(9,18,34,0.1)_100%)]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-end px-5 pb-16 md:px-8 md:pb-24">
          <div className="max-w-xl space-y-5">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-200">Official Labor Law Partner</p>
            <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">{headline}</h1>
            <p className="text-sm leading-relaxed text-slate-100 md:text-base">{subcopy}</p>
            <Link
              href={ctaHref}
              className="inline-flex items-center rounded-full border border-white/65 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              aria-label="상담하기 페이지로 이동"
            >
              상담하기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
