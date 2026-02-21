"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

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
const MAX_PRELOAD_MOBILE = 40;
const MAX_PRELOAD_DESKTOP = 80;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isReadyImage(image: HTMLImageElement | undefined): image is HTMLImageElement {
  return Boolean(image && image.complete && image.naturalWidth > 0);
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  alignX: number,
  alpha = 1,
) {
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
    drawX = (canvasWidth - drawWidth) * clamp(alignX, 0, 1);
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
  const introImageRef = useRef<HTMLImageElement | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  const sampledFrameSources = useMemo(() => {
    if (typeof window === "undefined") return frameSources;
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const step = isMobile ? MOBILE_FRAME_STEP : DESKTOP_FRAME_STEP;
    return frameSources.filter((_, index) => index % step === 0);
  }, [frameSources]);

  const useCanvas = sampledFrameSources.length > 0;

  const ensureImage = (src: string) => {
    const existing = loadedImagesRef.current.get(src);
    if (existing) return existing;

    const image = new Image();
    image.decoding = "async";
    image.src = src;
    image.onload = () => requestRenderRef.current?.();
    loadedImagesRef.current.set(src, image);
    return image;
  };

  // Preload frames into the persistent Map
  useEffect(() => {
    if (!useCanvas) return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    const maxPreload = isMobile ? MAX_PRELOAD_MOBILE : MAX_PRELOAD_DESKTOP;
    sampledFrameSources.slice(0, maxPreload).forEach((src) => {
      ensureImage(src);
    });
  }, [sampledFrameSources, useCanvas]);

  // Canvas rendering + scroll listener
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

    const getNearestLoadedImage = (start: number) => {
      const len = sampledFrameSources.length;
      for (let offset = 0; offset < len; offset += 1) {
        const prev = start - offset;
        if (prev >= 0) {
          const prevSrc = sampledFrameSources[prev];
          const prevImage = loadedImagesRef.current.get(prevSrc);
          if (isReadyImage(prevImage)) return prevImage;
        }

        const next = start + offset;
        if (next < len) {
          const nextSrc = sampledFrameSources[next];
          const nextImage = loadedImagesRef.current.get(nextSrc);
          if (isReadyImage(nextImage)) return nextImage;
        }
      }
      return undefined;
    };

    const renderFrame = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      ctx.clearRect(0, 0, width, height);

      const isDesktop = width >= 1024;
      const alignX = isDesktop ? 0.82 : 0.5;

      const frameCount = sampledFrameSources.length;
      if (frameCount === 0) return;

      const exactFrame = progressRef.current * (frameCount - 1);
      const baseIndex = Math.floor(exactFrame);
      const nextIndex = Math.min(baseIndex + 1, frameCount - 1);
      const blend = exactFrame - baseIndex;

      const baseSrc = sampledFrameSources[baseIndex];
      const nextSrc = sampledFrameSources[nextIndex];

      const baseImage = ensureImage(baseSrc);
      const nextImage = ensureImage(nextSrc);
      const introImage =
        introImageRef.current ??
        (() => {
          const image = new Image();
          image.decoding = "async";
          image.src = introSrc;
          image.onload = () => requestRenderRef.current?.();
          introImageRef.current = image;
          return image;
        })();

      // Draw the best available frame
      if (isReadyImage(baseImage)) {
        drawImageContain(ctx, baseImage, width, height, alignX, 1);
        if (isReadyImage(nextImage) && blend > 0) {
          drawImageContain(ctx, nextImage, width, height, alignX, blend);
        }
        return;
      }

      // Fallback: nearest loaded frame
      const fallbackImage = getNearestLoadedImage(baseIndex);
      if (fallbackImage) {
        drawImageContain(ctx, fallbackImage, width, height, alignX, 1);
        return;
      }

      // Last resort: intro image
      if (isReadyImage(introImage)) {
        drawImageContain(ctx, introImage, width, height, alignX, 1);
      }
    };

    const requestRender = () => {
      if (rafRenderIdRef.current !== null) return;
      rafRenderIdRef.current = window.requestAnimationFrame(() => {
        rafRenderIdRef.current = null;
        renderFrame();
      });
    };

    requestRenderRef.current = requestRender;

    const updateByScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;
      const scrollRange = sectionHeight - viewportHeight;
      if (scrollRange <= 0) return;

      progressRef.current = clamp((window.scrollY - sectionTop) / scrollRange, 0, 1);

      // Preload frames near current position
      const len = sampledFrameSources.length;
      const centerIndex = Math.floor(progressRef.current * Math.max(len - 1, 0));
      const around = 8;
      for (let i = centerIndex - around; i <= centerIndex + around; i += 1) {
        if (i < 0 || i >= len) continue;
        ensureImage(sampledFrameSources[i]);
      }

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
      requestRenderRef.current = null;
      window.removeEventListener("scroll", updateByScroll);
      window.removeEventListener("resize", onResize);
      if (rafRenderIdRef.current !== null) {
        window.cancelAnimationFrame(rafRenderIdRef.current);
      }
    };
  }, [introSrc, sampledFrameSources, useCanvas]);

  return (
    <section ref={sectionRef} className="relative h-[220vh]" aria-label="Main visual">
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-3 pt-14 md:px-6 md:pt-20">
        <div
          ref={stageRef}
          className="relative h-[82dvh] w-full overflow-hidden rounded-[28px] border border-slate-200/50 bg-[radial-gradient(140%_120%_at_50%_0%,#1f2e45_0%,#101927_56%,#0a111b_100%)] md:h-[84vh]"
        >
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_85%_at_50%_50%,rgba(145,170,203,0.18)_0%,rgba(145,170,203,0.05)_45%,rgba(10,17,27,0)_75%)]" />

          {/* Static intro image as background fallback */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat md:bg-[position:82%_50%]"
            style={{ backgroundImage: `url("${introSrc}")` }}
            aria-hidden="true"
          />

          {/* Canvas renders scroll-driven frames on top */}
          {useCanvas ? (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 block"
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
