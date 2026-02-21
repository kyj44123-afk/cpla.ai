"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
};

export default function ScrollReveal({ children, className, delayMs = 0 }: ScrollRevealProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={cn(
        "transform-gpu transition-all duration-700 ease-[cubic-bezier(0.2,0.65,0.25,1)]",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
