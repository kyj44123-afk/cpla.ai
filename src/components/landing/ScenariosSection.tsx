import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight, Building2, UserRound } from "lucide-react";

type Scenario = {
  title: string;
  description: string;
  tag: string;
};

const enterpriseScenarios: Scenario[] = [
  {
    title: "근로시간 누적 초과",
    description: "연장근로 관리 누락으로 월별 초과 시간이 반복 발생하는 상황입니다.",
    tag: "고위험",
  },
  {
    title: "연장수당 산정 불일치",
    description: "부서별 계산 방식이 달라 동일 직무 간 수당 차이가 발생합니다.",
    tag: "빈발",
  },
  {
    title: "포괄임금 계약 점검",
    description: "현재 계약 구조가 최신 해석 기준과 맞는지 재점검이 필요한 상태입니다.",
    tag: "점검필수",
  },
  {
    title: "취업규칙·계약서 미정합",
    description: "내부 규정과 실제 계약 문구가 달라 분쟁 시 해석 리스크가 큽니다.",
    tag: "긴급",
  },
];

const workerScenarios: Scenario[] = [
  {
    title: "임금체불·정산 지연",
    description: "지급일이 반복 지연되거나 약정과 실제 지급 금액이 다른 케이스입니다.",
    tag: "긴급",
  },
  {
    title: "연장수당 누락",
    description: "실제 근무시간 대비 수당이 충분히 반영되지 않은 정황이 있습니다.",
    tag: "빈발",
  },
  {
    title: "계약 종료·해지 분쟁",
    description: "계약 해지 사유와 절차가 불명확해 대응 순서 정리가 필요한 상태입니다.",
    tag: "고위험",
  },
  {
    title: "프리랜서 대금 분쟁",
    description: "업무 범위·검수·대금 지급 기준이 불명확해 분쟁이 길어지는 상황입니다.",
    tag: "점검필수",
  },
];

const tagTone: Record<string, string> = {
  고위험: "border-rose-200 bg-rose-50 text-rose-700",
  긴급: "border-amber-200 bg-amber-50 text-amber-700",
  빈발: "border-sky-200 bg-sky-50 text-sky-700",
  점검필수: "border-slate-300 bg-slate-100 text-slate-700",
};

function ScenarioItem({ title, description, tag }: Scenario) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-slate-900 md:text-base">{title}</h4>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tagTone[tag] ?? "border-slate-300 bg-slate-100 text-slate-700"}`}
        >
          {tag}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{description}</p>
    </article>
  );
}

function ScenarioColumn({
  icon,
  title,
  subtitle,
  scenarios,
  ctaHref,
  ctaText,
  ariaLabel,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  scenarios: Scenario[];
  ctaHref: string;
  ctaText: string;
  ariaLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700">{icon}</span>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

      <div className="mt-4 space-y-3">
        {scenarios.map((scenario) => (
          <ScenarioItem key={scenario.title} {...scenario} />
        ))}
      </div>

      <Link
        href={ctaHref}
        aria-label={ariaLabel}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-50 transition hover:bg-slate-800"
      >
        {ctaText}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}

export default function ScenariosSection() {
  return (
    <section
      aria-labelledby="scenario-title"
      className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] md:p-8"
    >
      <div className="mx-auto max-w-5xl">
        <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-600">
          USE CASES
        </p>
        <h2 id="scenario-title" className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          지금 겪는 상황과 가장 가까운 시나리오를 선택하세요
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
          복잡한 설명보다 현재 상황에 맞는 흐름부터 빠르게 안내합니다.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <ScenarioColumn
            icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
            title="기업용 대표 시나리오"
            subtitle="인사·노무 운영에서 빈발하는 리스크를 기준으로 구성했습니다."
            scenarios={enterpriseScenarios}
            ctaHref="#enterprise"
            ctaText="기업용 솔루션 보기"
            ariaLabel="기업용 솔루션 보기 섹션으로 이동"
          />

          <ScenarioColumn
            icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
            title="근로자·프리랜서 대표 시나리오"
            subtitle="개인·프리랜서 분쟁에서 실제 문의가 많은 유형을 모았습니다."
            scenarios={workerScenarios}
            ctaHref="#worker"
            ctaText="근로자·프리랜서용 보기"
            ariaLabel="근로자 프리랜서용 보기 섹션으로 이동"
          />
        </div>
      </div>
    </section>
  );
}
