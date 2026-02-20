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

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  focalX: number,
  focalY: number,
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
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imageRatio;
    const overflowX = drawWidth - canvasWidth;
    drawX = -overflowX * clamp(focalX, 0, 1);
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imageRatio;
    const overflowY = drawHeight - canvasHeight;
    drawY = -overflowY * clamp(focalY, 0, 1);
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
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
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

      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);
      const isDesktop = width >= 1024;
      const focalX = 0.5;
      const focalY = isDesktop ? 0.16 : 0.26;

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

      if (baseImage) drawImageCover(ctx, baseImage, width, height, focalX, focalY, 1);
      if (nextImage && blend > 0) drawImageCover(ctx, nextImage, width, height, focalX, focalY, blend);
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
    <section ref={sectionRef} className="relative h-[260vh]" aria-label="메인 비주얼">
      <div className="sticky top-0 h-screen overflow-hidden">
        {useCanvas ? (
          <canvas ref={canvasRef} className="absolute inset-0 block" aria-hidden="true" />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{ backgroundImage: `url("${introSrc}")`, backgroundPosition: "50% 16%" }}
          />
        )}

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
