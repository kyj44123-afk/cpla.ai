import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { FactStructurerWidget } from "@/components/landing-premium/HeroAiWidgets";

const checklist = [
  {
    topic: "조사 독립성",
    internal: "내부 이해관계로 인해 조사 신뢰성에 이견이 생길 수 있습니다.",
    external: "외부 구조는 객관성과 결과 수용도를 높입니다.",
  },
  {
    topic: "피해자 보호",
    internal: "기준이 모호하면 2차 피해 가능성이 커집니다.",
    external: "법적 기준에 맞춘 보호 프로토콜을 적용합니다.",
  },
  {
    topic: "보고서 활용성",
    internal: "사후 조치 및 재발방지와의 연계가 약할 수 있습니다.",
    external: "사실관계·판단근거·개선권고를 분리해 제공합니다.",
  },
];

const investigationScopes = [
  { title: "1일 조사 / 1주 보고", detail: "긴급 대응이 필요한 단일 사건에 적합합니다." },
  { title: "7일 조사 / 3주 보고", detail: "복수 인터뷰와 자료 검토가 필요한 일반 사건에 적합합니다." },
  { title: "심화 전문조사", detail: "반복 신고나 조직문화 이슈가 결합된 고난도 사건에 적합합니다." },
];

export default function HarassmentPage() {
  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#f4f8fc_0%,#ffffff_38%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <header className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_50px_-42px_rgba(15,23,42,0.75)] md:grid-cols-[1.1fr_0.9fr] md:items-start md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Harassment & Sexual Misconduct</p>
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">복잡하고 민감한 문제에 필요한 외부 전문조사</h1>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                민감 사안일수록 조사 절차의 공정성과 결과 보고서의 신뢰도가 핵심입니다.
              </p>
            </div>
            <FactStructurerWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">내부 자체조사 vs 외부 전문조사 체크리스트</h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="grid grid-cols-3 bg-slate-50 text-sm font-semibold text-slate-700">
                <p className="p-4">항목</p>
                <p className="p-4">내부</p>
                <p className="p-4">외부</p>
              </div>
              {checklist.map((item) => (
                <div key={item.topic} className="grid grid-cols-3 border-t border-slate-200 text-sm text-slate-700">
                  <p className="p-4 font-semibold text-slate-900">{item.topic}</p>
                  <p className="p-4 leading-relaxed">{item.internal}</p>
                  <p className="p-4 leading-relaxed">{item.external}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">조사 규모</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {investigationScopes.map((scope) => (
                <article key={scope.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900">{scope.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{scope.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white md:p-10">
            <h2 className="font-serif text-2xl md:text-4xl">대응 속도와 전문성이 결과를 바꿉니다</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">사건 개요를 공유해주시면 신속하게 조사 범위와 일정안을 안내드립니다.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              조사 의뢰
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
