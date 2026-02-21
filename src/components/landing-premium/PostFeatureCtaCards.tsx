"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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
    featureName: "노무 이슈 탐색기",
    description: "키워드만 입력하면 관련 이슈와 대응 포인트를 빠르게 정리해 드립니다.",
    ctaLabel: "자문 페이지 이동",
  },
  {
    menuName: "진단",
    href: "/diagnosis",
    featureName: "근로계약 간편 진단",
    description: "계약서 업로드 후 누락 및 위험 항목을 체크하고 개선 포인트를 안내합니다.",
    ctaLabel: "진단 페이지 이동",
  },
  {
    menuName: "컨설팅",
    href: "/consulting",
    featureName: "기업 리스크 분석",
    description: "인사 이슈를 분석하고 실행 가능한 로드맵으로 연결합니다.",
    ctaLabel: "컨설팅 페이지 이동",
  },
  {
    menuName: "괴롭힘 대응",
    href: "/harassment",
    featureName: "사실관계 구조화",
    description: "복잡한 진술 내용을 정리해 조사와 대응의 기준을 세울 수 있습니다.",
    ctaLabel: "대응 페이지 이동",
  },
  {
    menuName: "교육",
    href: "/training",
    featureName: "노무 퀴즈 생성",
    description: "실무에 필요한 학습 카드를 생성해 팀 단위 교육에 활용할 수 있습니다.",
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
    <motion.section
      className="bg-white px-5 pb-20 md:px-8 md:pb-24"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7 }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 md:p-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Functions</p>
          <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-4xl">업무별 AI 도구</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            자문부터 진단, 교육까지 필요한 기능을 바로 실행할 수 있도록 구성했습니다.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card, index) => (
              <motion.article
                key={card.menuName}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
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
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
