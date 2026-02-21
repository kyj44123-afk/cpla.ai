import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { ConsultingLinkWidget } from "@/components/landing-premium/HeroAiWidgets";

const processSteps = ["자료점검", "AI 분석", "전문가 검토", "개선 제안"];
const consultingAreas = ["규정정비", "HR제도", "고용조정", "도급파견", "노사관계", "사내근로복지기금"];

const cases = [
  {
    title: "임금체계 개편 프로젝트",
    before: "직군별 기준이 달라 같은 업무의 보상 편차가 커져 불만이 누적",
    after: "직무·역할 중심 보상 체계를 재설계해 기준을 통일하고 내부 수용도를 개선",
  },
  {
    title: "조직 재편 시 고용조정 지원",
    before: "인력 재배치 기준과 커뮤니케이션 부재로 노사 갈등 위험 증가",
    after: "절차·근거·일정이 명확한 실행안으로 분쟁 가능성을 낮추고 실행 속도 확보",
  },
];

export default function ConsultingPage() {
  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#ffffff_38%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <header className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_50px_-42px_rgba(15,23,42,0.75)] md:grid-cols-[1.1fr_0.9fr] md:items-start md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Consulting</p>
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">정교한 설계가 분쟁을 막습니다</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                제도는 문서가 아니라 실행 구조입니다. 데이터와 현장 맥락을 함께 분석해 실제 작동하는 개선안을 설계합니다.
              </p>
            </div>
            <ConsultingLinkWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">컨설팅 프로세스</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {processSteps.map((step, index) => (
                <article key={step} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold text-slate-500">STEP {index + 1}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{step}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">컨설팅 영역</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {consultingAreas.map((area) => (
                <article key={area} className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-lg font-semibold text-slate-900">
                  {area}
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">대표 컨설팅 사례</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {cases.map((item) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p className="rounded-2xl bg-slate-50 p-3">
                      <strong>Before:</strong> {item.before}
                    </p>
                    <p className="rounded-2xl bg-[#ecf6ff] p-3">
                      <strong>After:</strong> {item.after}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white md:p-10">
            <h2 className="font-serif text-2xl md:text-4xl">변화가 큰 시기일수록 프로젝트 설계가 중요합니다</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">현재 계획 중인 조직/제도 변경 과제를 공유해주시면 실행 중심으로 상담해드립니다.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              프로젝트 상담 예약
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
