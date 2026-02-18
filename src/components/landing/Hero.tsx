"use client";

import { KeyboardEvent, MouseEvent, ReactNode } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  FileSearch,
  LockKeyhole,
  Scale,
  UserRound,
} from "lucide-react";
import DashboardMockupCard from "@/components/landing/DashboardMockupCard";

type SegmentCardItem = {
  badge: string;
  title: string;
  fitFor: string;
  outcomes: string[];
  cta: string;
  helper: string;
  targetId: "enterprise" | "worker";
  icon: ReactNode;
  ariaLabel: string;
};

type TrustBadgeProps = {
  icon: ReactNode;
  text: string;
};

type SegmentCardProps = SegmentCardItem;

function scrollToTarget(targetId: SegmentCardItem["targetId"]) {
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.history.replaceState(null, "", `#${targetId}`);
}

function formatDateYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function TrustBadge({ icon, text }: TrustBadgeProps) {
  return (
    <li className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
      <span className="text-slate-500" aria-hidden="true">
        {icon}
      </span>
      <span>{text}</span>
    </li>
  );
}

function SegmentCard({ badge, title, fitFor, outcomes, cta, helper, targetId, icon, ariaLabel }: SegmentCardProps) {
  const onCardClick = () => scrollToTarget(targetId);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToTarget(targetId);
    }
  };

  const onButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    scrollToTarget(targetId);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onCardClick}
      onKeyDown={onKeyDown}
      className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-400 hover:shadow-[0_16px_32px_-20px_rgba(15,23,42,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/40 active:translate-y-0 active:shadow-sm"
    >
      <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-600">
        {badge}
      </span>

      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <span className="rounded-md bg-slate-100 p-1.5 text-slate-600" aria-hidden="true">
          {icon}
        </span>
        <span>{title}</span>
      </div>

      <p className="mt-3 text-sm font-medium text-slate-700">{fitFor}</p>

      <ul className="mt-4 space-y-2">
        {outcomes.map((outcome) => (
          <li key={outcome} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onButtonClick}
        aria-label={`${title} 섹션으로 이동`}
      className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-50 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 active:bg-slate-900"
      >
        {cta}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

export default function Hero() {
  const updateDate = formatDateYYYYMMDD(new Date());

  const segmentCards: SegmentCardItem[] = [
    {
      badge: "관리자/인사팀",
      title: "기업용 보기",
      fitFor: "인사 리스크를 체계적으로 점검하고 실행 기준이 필요한 조직에 적합합니다.",
      outcomes: ["이슈별 리스크 우선순위 리포트", "조항 근거가 포함된 대응안 초안", "실행 일정 기반 운영 체크리스트"],
      cta: "기업용 솔루션 보기",
      helper: "2분 설명 → 맞춤 진단 흐름 안내",
      targetId: "enterprise",
      icon: <Building2 className="h-4 w-4" />,
      ariaLabel: "기업 고객용 노무 솔루션 안내 섹션으로 이동",
    },
    {
      badge: "개인/프리랜서",
      title: "근로자·프리랜서 보기",
      fitFor: "내 상황에서 바로 확인할 쟁점과 다음 행동이 필요한 개인에게 적합합니다.",
      outcomes: ["쟁점 중심 상황 진단 요약", "준비할 증빙·기록 자료 목록", "다음 단계별 대응 가이드"],
      cta: "근로자·프리랜서용 보기",
      helper: "1분 체크 → 필요한 다음 단계 안내",
      targetId: "worker",
      icon: <UserRound className="h-4 w-4" />,
      ariaLabel: "근로자 및 프리랜서용 노무 안내 섹션으로 이동",
    },
  ];

  return (
    <section
      aria-labelledby="hero-title"
      className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#fcfdff_0%,#f5f8fc_100%)] p-6 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.5)] md:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <p className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-slate-600">
            PROFESSIONAL × AI LEGAL TECH
          </p>

          <h1 id="hero-title" className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-950 md:text-4xl">
            노무 리스크를 줄이고,
            <br className="hidden md:block" /> 실행 결정까지 바로 연결합니다
          </h1>

          <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-slate-700 md:text-lg">
            {"이슈를 AI로 먼저 구조화하고, 전문가 검토로 판단 근거를 교차 검증합니다.\n실무에 적용 가능한 실행 설계까지 한 흐름으로 제공합니다."}
          </p>

          <p className="mt-3 text-sm font-medium text-slate-600">공인노무사 검토 체계를 갖춘 AI 기반 노무 운영 지원</p>

          <ul className="mt-5 flex flex-wrap gap-2.5" aria-label="신뢰 배지">
            <TrustBadge icon={<FileSearch className="h-4 w-4" />} text="근거 표시(조항/가이드 기준)" />
            <TrustBadge icon={<Scale className="h-4 w-4" />} text="전문가 교차 검증" />
            <TrustBadge icon={<LockKeyhole className="h-4 w-4" />} text="기밀 처리/비식별 옵션" />
          </ul>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {segmentCards.map((card) => (
              <SegmentCard key={card.targetId} {...card} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <DashboardMockupCard data={{ updateDate }} />
        </div>
      </div>
    </section>
  );
}
