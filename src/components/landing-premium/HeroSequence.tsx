"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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
  const updateRafRef = useRef<number | null>(null);
  const swapRafRef = useRef<number | null>(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [frameVisible, setFrameVisible] = useState(true);

  useEffect(() => {
    if (frameSources.length === 0) return;

    const preloadCount = Math.min(frameSources.length, 80);
    for (let i = 0; i < preloadCount; i += 1) {
      const img = new Image();
      img.decoding = "async";
      img.src = frameSources[i];
    }
  }, [frameSources]);

  useEffect(() => {
    if (frameSources.length === 0) return;

    let lastFrame = -1;

    const updateFrame = () => {
      updateRafRef.current = null;

      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollRange = sectionHeight - viewportHeight;
      if (scrollRange <= 0) return;

      const progress = clamp((window.scrollY - sectionTop) / scrollRange, 0, 1);
      const nextFrame = Math.round(progress * (frameSources.length - 1));

      if (nextFrame === lastFrame) return;
      lastFrame = nextFrame;

      setFrameVisible(false);
      if (swapRafRef.current !== null) {
        window.cancelAnimationFrame(swapRafRef.current);
      }
      swapRafRef.current = window.requestAnimationFrame(() => {
        setCurrentFrame(nextFrame);
        setFrameVisible(true);
        swapRafRef.current = null;
      });
    };

    const onScrollOrResize = () => {
      if (updateRafRef.current !== null) return;
      updateRafRef.current = window.requestAnimationFrame(updateFrame);
    };

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (updateRafRef.current !== null) window.cancelAnimationFrame(updateRafRef.current);
      if (swapRafRef.current !== null) window.cancelAnimationFrame(swapRafRef.current);
    };
  }, [frameSources]);

  const activeFrameSrc = frameSources[currentFrame] || "";

  return (
    <section ref={sectionRef} className="relative h-[220vh]" aria-label="Main visual">
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-3 pt-14 md:px-6 md:pt-20">
        <div className="relative h-[82dvh] w-full overflow-hidden rounded-[28px] border border-slate-200/50 bg-[radial-gradient(140%_120%_at_50%_0%,#1f2e45_0%,#101927_56%,#0a111b_100%)] md:h-[84vh]">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_85%_at_50%_50%,rgba(145,170,203,0.18)_0%,rgba(145,170,203,0.05)_45%,rgba(10,17,27,0)_75%)]" />

          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat md:bg-[position:82%_50%]"
            style={{ backgroundImage: `url("${introSrc}")` }}
            aria-hidden="true"
          />

          {activeFrameSrc ? (
            <div
              className={`absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-150 md:bg-[position:82%_50%] ${
                frameVisible ? "opacity-100" : "opacity-0"
              }`}
              style={{ backgroundImage: `url("${activeFrameSrc}")` }}
              aria-hidden="true"
            />
          ) : null}

          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(9,18,34,0.52)_12%,rgba(9,18,34,0.18)_52%,rgba(9,18,34,0.1)_100%)]" />

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
