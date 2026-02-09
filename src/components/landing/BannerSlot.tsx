"use client";

/**
 * 배너 광고 슬롯 (상단)
 * 수익 모델: 배너 광고 — 실제 광고 연동 전 플레이스홀더
 */
export function BannerSlot() {
  return (
    <section
      className="flex min-h-[120px] items-center justify-center rounded-xl border border-border bg-muted/40 sm:min-h-[160px]"
      aria-label="배너 광고"
    >
      <span className="text-sm font-medium text-muted-foreground">
        배너 광고 슬롯
      </span>
    </section>
  );
}
