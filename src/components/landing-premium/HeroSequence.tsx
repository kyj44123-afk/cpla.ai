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
  const rafIdRef = useRef<number | null>(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [frameReady, setFrameReady] = useState(false);

  const frames = useMemo(() => (frameSources.length > 0 ? frameSources : [introSrc]), [frameSources, introSrc]);
  const activeFrameSrc = frames[frameIndex] ?? introSrc;

  useEffect(() => {
    if (frames.length === 0) return;

    const preloadCount = Math.min(frames.length, 90);
    for (let i = 0; i < preloadCount; i += 1) {
      const image = new Image();
      image.decoding = "async";
      image.src = frames[i];
    }
  }, [frames]);

  useEffect(() => {
    if (frames.length <= 1) return;

    let lastIndex = -1;

    const updateByScroll = () => {
      rafIdRef.current = null;
      const section = sectionRef.current;
      if (!section) return;

      const viewportHeight = window.innerHeight;
      const scrollRange = Math.max(section.offsetHeight - viewportHeight, 1);
      const rectTop = section.getBoundingClientRect().top;
      const traveled = clamp(-rectTop, 0, scrollRange);
      const progress = traveled / scrollRange;
      const nextIndex = Math.round(progress * (frames.length - 1));

      if (nextIndex === lastIndex) return;
      lastIndex = nextIndex;
      setFrameIndex(nextIndex);
    };

    const scheduleUpdate = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = window.requestAnimationFrame(updateByScroll);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [frames]);

  return (
    <section ref={sectionRef} className="relative z-0 h-[240vh]" aria-label="Main visual">
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-3 pt-14 md:px-6 md:pt-20">
        <div className="relative h-[82dvh] w-full overflow-hidden rounded-[28px] border border-slate-200/50 bg-[radial-gradient(140%_120%_at_50%_0%,#1f2e45_0%,#101927_56%,#0a111b_100%)] md:h-[84vh]">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_85%_at_50%_50%,rgba(145,170,203,0.18)_0%,rgba(145,170,203,0.05)_45%,rgba(10,17,27,0)_75%)]" />

          <img
            src={introSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain object-center md:object-[82%_50%]"
          />

          <img
            src={activeFrameSrc}
            alt=""
            aria-hidden="true"
            onLoad={() => setFrameReady(true)}
            className={`absolute inset-0 h-full w-full object-contain object-center transition-opacity duration-200 md:object-[82%_50%] ${
              frameReady ? "opacity-100" : "opacity-0"
            }`}
          />

          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(9,18,34,0.56)_12%,rgba(9,18,34,0.24)_52%,rgba(9,18,34,0.14)_100%)]" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-end px-5 pb-10 md:px-8 md:pb-18">
            <div className="max-w-xl space-y-4 rounded-2xl bg-slate-900/35 p-4 backdrop-blur-[2px] md:bg-transparent md:p-0 md:backdrop-blur-none">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-200">Official Labor Law Partner</p>
              <h1 className="whitespace-pre-line font-serif text-3xl leading-tight text-white md:text-6xl">{headline}</h1>
              <p className="text-sm leading-relaxed text-slate-100 md:text-base">{subcopy}</p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={ctaHref}
                  className="inline-flex items-center rounded-full border border-white/65 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                >
                  상담 예약
                </Link>
                <Link
                  href="/enterprise-diagnosis"
                  className="inline-flex items-center rounded-full border border-white/65 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                >
                  RISK 진단
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
