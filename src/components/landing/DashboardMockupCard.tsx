import { AlertTriangle, ChevronRight, CircleCheckBig } from "lucide-react";

export type DashboardMockData = {
  title: string;
  subtitle: string;
  statusBadge: string;
  violationCountLabel: string;
  violationCount: number;
  progressPercent: number;
  riskPriorityLabel: string;
  highRiskTitle: string;
  highRiskItem: string;
  highRiskNote: string;
  actionPlanLabel: string;
  rootCauseTitle: string;
  rootCause: string;
  expertReviewStatus: "대기" | "완료";
  monitorLabel: string;
  evidenceLabel: string;
  updateDate: string;
};

const defaultMockData: DashboardMockData = {
  title: "LIVE DASHBOARD",
  subtitle: "Labor Compliance Monitor",
  statusBadge: "AI Analysis Complete",
  violationCountLabel: "노동법 위반 조항",
  violationCount: 8,
  progressPercent: 64,
  riskPriorityLabel: "리스크 우선순위",
  highRiskTitle: "고위험 위반 항목",
  highRiskItem: "근로시간 과다",
  highRiskNote: "긴급 시정 계획 필요",
  actionPlanLabel: "조치 플랜",
  rootCauseTitle: "핵심적 위반 원인",
  rootCause: "조직부실, 관리체계 미흡",
  expertReviewStatus: "완료",
  monitorLabel: "모니터링 알림",
  evidenceLabel: "근거 보기",
  updateDate: "2026.02.18",
};

type DashboardMockupCardProps = {
  data?: Partial<DashboardMockData>;
};

export default function DashboardMockupCard({ data = defaultMockData }: DashboardMockupCardProps) {
  const mergedData: DashboardMockData = {
    ...defaultMockData,
    ...data,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_36px_-28px_rgba(15,23,42,0.5)]">
      <div className="flex items-start justify-between border-b border-slate-200 bg-slate-950 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-300">{mergedData.title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{mergedData.subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/30 bg-sky-300/10 px-2.5 py-1 text-xs font-medium text-sky-100">
          {mergedData.statusBadge}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {mergedData.violationCountLabel} {mergedData.violationCount}개
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{mergedData.violationCount}건</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
              {mergedData.riskPriorityLabel}
            </span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-slate-800" style={{ width: `${mergedData.progressPercent}%` }} />
          </div>
        </article>

        <article className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-700">{mergedData.highRiskTitle}</p>
            <span className="rounded-full border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-amber-700">
              {mergedData.actionPlanLabel}
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-slate-900">{mergedData.highRiskItem}</p>
          <p className="mt-1 text-xs font-medium text-amber-800">{mergedData.highRiskNote}</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">{mergedData.rootCauseTitle}</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{mergedData.rootCause}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-slate-500">{mergedData.monitorLabel}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                mergedData.expertReviewStatus === "완료"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-slate-300 bg-white text-slate-700"
              }`}
            >
              {mergedData.expertReviewStatus === "완료" ? (
                <CircleCheckBig className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              전문가 교차 검증 {mergedData.expertReviewStatus}
            </span>
          </div>
        </article>

        <div className="flex items-center justify-between pt-1">
          <a
            href="#"
            aria-label="근거 보기"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 underline-offset-2 transition hover:text-slate-950 hover:underline"
          >
            {mergedData.evidenceLabel}
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="text-xs text-slate-500">업데이트: {mergedData.updateDate}</p>
        </div>
      </div>
    </div>
  );
}

export { defaultMockData };
