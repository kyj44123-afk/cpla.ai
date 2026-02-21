"use client";

import Link from "next/link";

type FeatureCard = {
  menuName: string;
  href: string;
  featureName: string;
  description: string;
  ctaLabel: string;
};

type AnalyticsPayload = {
  event: "ai_function_card_click";
  section: "ai_functions";
  menu_name: string;
  feature_name: string;
  target_url: string;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (command: "event", eventName: string, params?: Record<string, unknown>) => void;
  }
}

const cards: FeatureCard[] = [
  {
    menuName: "자문",
    href: "/advisory",
    featureName: "판례탐색기",
    description: "키워드 입력으로 관련 판례 3건의 판결번호와 요약을 빠르게 확인할 수 있습니다.",
    ctaLabel: "자문 페이지 이동",
  },
  {
    menuName: "진단",
    href: "/diagnosis",
    featureName: "근로계약서 간단진단",
    description: "근로계약서 PDF를 업로드하면 명시 누락 가능 항목을 키워드로 안내합니다.",
    ctaLabel: "진단 페이지 이동",
  },
  {
    menuName: "컨설팅",
    href: "/consulting",
    featureName: "기업 진단 연결",
    description: "컨설팅 전 기업 리스크 진단(`/enterprise-diagnosis`)으로 바로 연결됩니다.",
    ctaLabel: "컨설팅 페이지 이동",
  },
  {
    menuName: "괴롭힘·성희롱",
    href: "/harassment",
    featureName: "사실관계 구조화",
    description: "상황을 입력하면 육하원칙 기준으로 사실관계를 구조화해 보여줍니다.",
    ctaLabel: "괴롭힘·성희롱 페이지 이동",
  },
  {
    menuName: "교육",
    href: "/training",
    featureName: "퀴즈퀴즈",
    description: "업종 맞춤형 노동법 퀴즈 카드 3개를 생성하고 카드형으로 탐색할 수 있습니다.",
    ctaLabel: "교육 페이지 이동",
  },
];

function trackCardClick(card: FeatureCard) {
  if (typeof window === "undefined") return;

  const payload: AnalyticsPayload = {
    event: "ai_function_card_click",
    section: "ai_functions",
    menu_name: card.menuName,
    feature_name: card.featureName,
    target_url: card.href,
  };

  window.dataLayer?.push(payload);
  window.gtag?.("event", "ai_function_card_click", {
    section: payload.section,
    menu_name: payload.menu_name,
    feature_name: payload.feature_name,
    target_url: payload.target_url,
  });
}

export default function PostFeatureCtaCards() {
  return (
    <section className="bg-white px-5 pb-20 md:px-8 md:pb-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI functions</p>
          <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-4xl">AI functions</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">공인노무사 곽영준이 제공하는 AI 기능들</p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => (
              <article key={card.menuName} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{card.menuName}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{card.featureName}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{card.description}</p>
                <Link
                  href={card.href}
                  onClick={() => trackCardClick(card)}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  {card.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
