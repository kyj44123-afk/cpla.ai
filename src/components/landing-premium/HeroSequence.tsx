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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isReadyImage(image: HTMLImageElement | undefined | null): image is HTMLImageElement {
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
    drawHeight = canvasWidth / imageRatio;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
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
  const scrollRafRef = useRef<number | null>(null);
  const renderRafRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const introImageRef = useRef<HTMLImageElement | null>(null);

  const frames = useMemo(() => (frameSources.length > 0 ? frameSources : introSrc ? [introSrc] : []), [frameSources, introSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || frames.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const requestRender = () => {
      if (renderRafRef.current !== null) return;
      renderRafRef.current = window.requestAnimationFrame(() => {
        renderRafRef.current = null;
        renderFrame();
      });
    };

    const ensureImage = (src: string) => {
      const existing = loadedImagesRef.current.get(src);
      if (existing) return existing;

      const image = new Image();
      image.decoding = "async";
      image.src = src;
      image.onload = requestRender;
      image.onerror = requestRender;
      loadedImagesRef.current.set(src, image);
      return image;
    };

    const ensureIntroImage = () => {
      const fallbackSrc = introSrc || frames[0];
      if (!fallbackSrc) return null;

      if (introImageRef.current && introImageRef.current.src.endsWith(fallbackSrc)) {
        return introImageRef.current;
      }

      const image = new Image();
      image.decoding = "async";
      image.src = fallbackSrc;
      image.onload = requestRender;
      image.onerror = requestRender;
      introImageRef.current = image;
      return image;
    };

    const getNearestLoadedImage = (start: number) => {
      const len = frames.length;
      for (let offset = 0; offset < len; offset += 1) {
        const prev = start - offset;
        if (prev >= 0) {
          const prevImage = loadedImagesRef.current.get(frames[prev]);
          if (isReadyImage(prevImage)) return prevImage;
        }

        const next = start + offset;
        if (next < len) {
          const nextImage = loadedImagesRef.current.get(frames[next]);
          if (isReadyImage(nextImage)) return nextImage;
        }
      }

      return null;
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      requestRender();
    };

    const renderFrame = () => {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const alignX = width >= 1024 ? 0.82 : 0.5;

      ctx.clearRect(0, 0, width, height);

      if (frames.length === 1) {
        const onlyImage = ensureImage(frames[0]);
        if (isReadyImage(onlyImage)) {
          drawImageContain(ctx, onlyImage, width, height, alignX, 1);
          return;
        }
      }

      const exactFrame = progressRef.current * (frames.length - 1);
      const baseIndex = Math.floor(exactFrame);
      const nextIndex = Math.min(baseIndex + 1, frames.length - 1);
      const blend = exactFrame - baseIndex;

      const baseImage = ensureImage(frames[baseIndex]);
      const nextImage = ensureImage(frames[nextIndex]);

      if (isReadyImage(baseImage)) {
        drawImageContain(ctx, baseImage, width, height, alignX, 1);
        if (isReadyImage(nextImage) && blend > 0) {
          drawImageContain(ctx, nextImage, width, height, alignX, blend);
        }
        return;
      }

      const fallback = getNearestLoadedImage(baseIndex);
      if (fallback) {
        drawImageContain(ctx, fallback, width, height, alignX, 1);
        return;
      }

      const introImage = ensureIntroImage();
      if (isReadyImage(introImage)) {
        drawImageContain(ctx, introImage, width, height, alignX, 1);
      }
    };

    const preloadNearCurrentFrame = () => {
      const centerIndex = Math.floor(progressRef.current * Math.max(frames.length - 1, 0));
      const around = 8;
      for (let i = centerIndex - around; i <= centerIndex + around; i += 1) {
        if (i < 0 || i >= frames.length) continue;
        ensureImage(frames[i]);
      }
    };

    const updateByScroll = () => {
      const section = sectionRef.current;
      if (!section) return;

      const viewportHeight = window.innerHeight;
      const scrollRange = Math.max(section.offsetHeight - viewportHeight, 1);
      const rectTop = section.getBoundingClientRect().top;
      const traveled = clamp(-rectTop, 0, scrollRange);
      progressRef.current = traveled / scrollRange;

      preloadNearCurrentFrame();
      requestRender();
    };

    const scheduleUpdate = () => {
      if (scrollRafRef.current !== null) return;
      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null;
        updateByScroll();
      });
    };

    const preloadCount = Math.min(frames.length, 80);
    for (let i = 0; i < preloadCount; i += 1) {
      ensureImage(frames[i]);
    }

    resizeCanvas();
    scheduleUpdate();

    const onResize = () => {
      resizeCanvas();
      scheduleUpdate();
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", onResize);
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
      if (renderRafRef.current !== null) {
        window.cancelAnimationFrame(renderRafRef.current);
      }
    };
  }, [frames, introSrc]);

  return (
    <section ref={sectionRef} className="relative z-0 h-[240vh]" aria-label="Main visual">
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center px-3 pt-14 md:px-6 md:pt-20">
        <div
          ref={stageRef}
          className="relative h-[82dvh] w-full overflow-hidden rounded-[28px] border border-slate-200/50 bg-[radial-gradient(140%_120%_at_50%_0%,#1f2e45_0%,#101927_56%,#0a111b_100%)] md:h-[84vh]"
        >
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute inset-0 bg-[radial-gradient(90%_85%_at_50%_50%,rgba(145,170,203,0.18)_0%,rgba(145,170,203,0.05)_45%,rgba(10,17,27,0)_75%)]" />

          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat md:bg-[position:82%_50%]"
            style={{ backgroundImage: `url("${introSrc}")` }}
            aria-hidden="true"
          />

          {frames.length > 0 ? <canvas ref={canvasRef} className="absolute inset-0 block" aria-hidden="true" /> : null}

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
