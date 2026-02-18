import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight, Bot, ClipboardCheck, Radar } from "lucide-react";

type ProcessStep = {
  step: string;
  title: string;
  description: string;
  output: string;
  icon: ReactNode;
};

const steps: ProcessStep[] = [
  {
    step: "STEP 01",
    title: "AI 스캔(분석)",
    description:
      "현재 이슈를 빠르게 구조화해 위험 지점을 식별합니다.\n근거와 우선순위를 함께 제시해 먼저 처리할 항목을 명확히 합니다.",
    output: "AI 분석 리포트(위험 항목·근거·우선순위)",
    icon: <Radar className="h-5 w-5" aria-hidden="true" />,
  },
  {
    step: "STEP 02",
    title: "노무사 설계",
    description:
      "분석 결과를 실무에 맞는 실행 계획으로 전환합니다.\n내부 규정 정비와 문서·커뮤니케이션 방향까지 함께 설계합니다.",
    output: "실행 설계(조치안·내부 규정·문서 템플릿)",
    icon: <ClipboardCheck className="h-5 w-5" aria-hidden="true" />,
  },
  {
    step: "STEP 03",
    title: "운영/보조",
    description:
      "실행 이후 변화 항목을 추적하며 안정적으로 운영합니다.\n업데이트 알림과 재점검 루프로 누락 없이 관리합니다.",
    output: "지속 모니터링(업데이트·리마인드·재점검)",
    icon: <Bot className="h-5 w-5" aria-hidden="true" />,
  },
];

export default function ProcessSection() {
  return (
    <section
      aria-labelledby="process-title"
      className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] md:p-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-600">
          PROCESS + DELIVERABLES
        </p>
        <h2 id="process-title" className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          분석에서 실행까지, 산출물이 남는 3단계 프로세스
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
          무엇을 했는지보다 무엇을 받는지가 분명한 구조로 설계했습니다.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <article
            key={step.step}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700">{step.icon}</span>
              <p className="text-xs font-semibold tracking-[0.12em] text-slate-500">{step.step}</p>
            </div>

            <h3 className="mt-3 text-lg font-semibold text-slate-900">{step.title}</h3>

            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{step.description}</p>

            <p className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800">
              산출물: {step.output}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-5 md:px-6">
        <p className="text-center text-sm font-medium text-slate-200 md:text-base">
          어떤 고객이신가요? 맞는 흐름으로 바로 안내합니다.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Link
            href="#enterprise"
            aria-label="기업용 보기 섹션으로 이동"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            기업용 솔루션 보기
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="#worker"
            aria-label="근로자용 보기 섹션으로 이동"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-transparent px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-100 hover:bg-slate-900"
          >
            근로자용 보기
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
