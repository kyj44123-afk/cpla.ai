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
const MOBILE_FRAME_STEP = 1;
const DESKTOP_FRAME_STEP = 1;
const MAX_PRELOAD_MOBILE = 36;
const MAX_PRELOAD_DESKTOP = 64;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  alpha = 1,
) {
  if (!image.naturalWidth || !image.naturalHeight) return;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth = canvasWidth;
  let drawHeight = canvasHeight;
  let drawX = 0;
  let drawY = 0;

  if (imageRatio > canvasRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imageRatio;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imageRatio;
    drawX = (canvasWidth - drawWidth) / 2;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  ctx.restore();
}

export default function HeroSequence({
  introSrc,
  frameSources,
  ctaHref,
  headline,
  subcopy,
}: HeroSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(0);
  const rafRenderIdRef = useRef<number | null>(null);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const sampledFrameSources = useMemo(() => {
    if (typeof window === "undefined") return frameSources;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const step = isMobile ? MOBILE_FRAME_STEP : DESKTOP_FRAME_STEP;
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

  const useCanvas = !isReducedMotion && sampledFrameSources.length > 0;

  useEffect(() => {
    if (!useCanvas) return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const maxPreload = isMobile ? MAX_PRELOAD_MOBILE : MAX_PRELOAD_DESKTOP;
    const targets = sampledFrameSources.slice(0, maxPreload);

    targets.forEach((src) => {
      if (loadedImagesRef.current.has(src)) return;
      const image = new Image();
      image.src = src;
      loadedImagesRef.current.set(src, image);
    });
  }, [sampledFrameSources, useCanvas]);

  useEffect(() => {
    if (!useCanvas) return;

    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderFrame();
    };

    const renderFrame = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      ctx.clearRect(0, 0, width, height);

      const frameCount = sampledFrameSources.length;
      if (frameCount === 0) return;

      const exactFrame = progressRef.current * (frameCount - 1);
      const baseIndex = Math.floor(exactFrame);
      const nextIndex = Math.min(baseIndex + 1, frameCount - 1);
      const blend = exactFrame - baseIndex;

      const baseSrc = sampledFrameSources[baseIndex];
      const nextSrc = sampledFrameSources[nextIndex];
      const baseImage = loadedImagesRef.current.get(baseSrc);
      const nextImage = loadedImagesRef.current.get(nextSrc);

      if (baseImage) drawImageContain(ctx, baseImage, width, height, 1);
      if (nextImage && blend > 0) drawImageContain(ctx, nextImage, width, height, blend);
    };

    const requestRender = () => {
      if (rafRenderIdRef.current !== null) return;
      rafRenderIdRef.current = window.requestAnimationFrame(() => {
        rafRenderIdRef.current = null;
        renderFrame();
      });
    };

    const updateByScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollRange = sectionHeight - viewportHeight;
      if (scrollRange <= 0) return;

      progressRef.current = clamp((window.scrollY - sectionTop) / scrollRange, 0, 1);
      requestRender();
    };

    resizeCanvas();
    updateByScroll();

    const onResize = () => {
      resizeCanvas();
      updateByScroll();
    };

    window.addEventListener("scroll", updateByScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", updateByScroll);
      window.removeEventListener("resize", onResize);
      if (rafRenderIdRef.current !== null) {
        window.cancelAnimationFrame(rafRenderIdRef.current);
      }
    };
  }, [sampledFrameSources, useCanvas]);

  return (
    <section ref={sectionRef} className="relative h-[240vh]" aria-label="메인 비주얼">
      <div className="sticky top-0 flex h-screen items-center justify-center px-3 pt-16 md:px-6 md:pt-20">
        <div
          ref={stageRef}
          className="relative h-[74vh] w-full overflow-hidden rounded-[28px] border border-slate-200/50 bg-[radial-gradient(140%_120%_at_50%_0%,#1f2e45_0%,#101927_56%,#0a111b_100%)] md:h-[80vh]"
        >
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_85%_at_50%_50%,rgba(145,170,203,0.18)_0%,rgba(145,170,203,0.05)_45%,rgba(10,17,27,0)_75%)]" />

          {useCanvas ? (
            <canvas ref={canvasRef} className="absolute inset-0 block" aria-hidden="true" />
          ) : (
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${introSrc}")` }}
            />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(9,18,34,0.55)_12%,rgba(9,18,34,0.18)_52%,rgba(9,18,34,0.1)_100%)]" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-end px-5 pb-12 md:px-8 md:pb-20">
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
      </div>
    </section>
  );
}
