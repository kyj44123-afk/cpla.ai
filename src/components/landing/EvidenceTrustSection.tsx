import { FileCheck2, LockKeyhole, Scale } from "lucide-react";
import { ReactNode } from "react";

type TrustItem = {
  title: string;
  description: string;
  support: string;
  microcopy: string;
  icon: ReactNode;
};

const trustItems: TrustItem[] = [
  {
    title: "근거 표시 원칙",
    description: "조항/가이드 기준으로 근거를 남깁니다",
    support: "판단마다 확인한 기준을 함께 제시해 추적 가능한 기록을 만듭니다.",
    microcopy: "예시: '근거 보기'를 누르면 적용 기준과 검토 메모를 확인합니다.",
    icon: <FileCheck2 className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "교차 검증 프로세스",
    description: "AI 결과를 노무사가 검토하고 보완합니다",
    support: "초안과 최종안을 분리해 누락·오해 가능성을 줄이는 절차로 운영합니다.",
    microcopy: "예시: '검토 완료' 표시는 전문가 확인이 끝난 항목임을 의미합니다.",
    icon: <Scale className="h-5 w-5" aria-hidden="true" />,
  },
  {
    title: "기밀/보안",
    description: "자료 비식별 옵션과 접근 통제를 제공합니다",
    support: "민감 정보는 필요한 범위에서만 다루고 권한별 접근 기록을 관리합니다.",
    microcopy: "예시: '비식별 업로드' 선택 시 개인식별 정보는 가림 처리됩니다.",
    icon: <LockKeyhole className="h-5 w-5" aria-hidden="true" />,
  },
];

export default function EvidenceTrustSection() {
  return (
    <section
      aria-labelledby="evidence-trust-title"
      className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] md:p-8"
    >
      <div className="mx-auto max-w-5xl">
        <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-600">
          EVIDENCE / TRUST
        </p>
        <h2 id="evidence-trust-title" className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          신뢰는 경험담이 아니라, 검증 가능한 체계에서 나옵니다
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
          모든 결과는 근거, 검토, 보안 원칙 안에서 관리됩니다.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {trustItems.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <span className="inline-flex rounded-lg border border-slate-200 bg-white p-2 text-slate-700">{item.icon}</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm font-medium text-slate-800">{item.description}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.support}</p>
              <p className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">{item.microcopy}</p>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          상담 전 일반 정보이며, 구체 사안은 검토 후 확정됩니다.
        </p>
      </div>
    </section>
  );
}
