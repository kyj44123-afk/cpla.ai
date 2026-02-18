import Link from "next/link";
import { ArrowRight } from "lucide-react";

const positioningColumns = [
  {
    title: "AI 분석",
    items: ["기밀 보장 AI분석 Tool", "정량·정성 데이터 반영", "분석결과 자체 검증"],
  },
  {
    title: "전문가 설계",
    items: ["AI 산출물에 대한 메타분석", "현실적 실현가능성 판단", "최적의 전략수립 및 실행"],
  },
  {
    title: "AI 실행보조",
    items: ["문서 작업 효율화", "최신 트렌드 지속 모니터링", "전문가 설계결과에 대한 n차검증"],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_35%,#edf4ff_100%)] text-[#0F172A]">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <header className="mb-14 flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">CPLA + AI</p>
            <p className="mt-1 text-sm text-slate-600">노무법인 호연의 AI 플랫폼</p>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500">Director</p>
            <p className="mt-1 text-sm text-slate-700">노무법인호연 대표노무사 곽영준 KWAK YOUNG JUN</p>
          </div>
        </header>

        <section className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-600">
              PROFESSIONAL × AI LEGAL TECH
            </p>
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">공인노무사 + AI</h1>
            <p className="mt-6 whitespace-pre-line text-xl leading-relaxed text-slate-700">
              {"고객이 처한 HR·노동 문제를\n'제대로' 개선하기 위해\nAI는 분석하고, 전문가는 실행합니다."}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chat?mode=enterprise"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F172A] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                기업용(Enterprise)
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/counseling"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                근로자·프리랜서
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.55)]">
              <div className="flex items-center justify-between bg-[#0F172A] px-5 py-4 md:px-6">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.15em] text-blue-200">LIVE DASHBOARD</p>
                  <p className="mt-1 text-sm font-semibold text-white">Labor Compliance Monitor</p>
                </div>
                <span className="rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-100">
                  AI Analysis Complete
                </span>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">노동법 위반 조항</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">8개</p>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 w-[62%] rounded-full bg-blue-500" />
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">고위험 위반 항목</p>
                  <p className="mt-2 text-xl font-semibold text-[#0F172A]">근로시간 과다</p>
                  <p className="mt-2 text-xs text-blue-700">긴급 시정 계획 필요</p>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-medium text-slate-500">핵심적 위반 원인</p>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">조직부실, 관리체계 미흡</p>
                  <p className="mt-1 text-xs text-slate-500">전문가 실행 설계와 교차 검증 대기 중</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
            AI를 가장 완벽하게 사용하는 방법
          </h2>
          <p className="mt-5 text-center text-2xl font-semibold text-[#0F172A]">[공인노무사 + AI] ONE-TEAM</p>

          <div className="mt-9 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
            <article className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6 text-center">
              <h3 className="text-3xl font-semibold text-[#0F172A]">{positioningColumns[0].title}</h3>
              <ul className="mt-5 space-y-4 text-xl leading-relaxed text-slate-700">
                {positioningColumns[0].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="flex items-center justify-center text-3xl font-semibold text-blue-300">+</div>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <h3 className="text-3xl font-semibold text-[#0F172A]">{positioningColumns[1].title}</h3>
              <ul className="mt-5 space-y-4 text-xl leading-relaxed text-slate-700">
                {positioningColumns[1].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="flex items-center justify-center text-3xl font-semibold text-blue-300">+</div>

            <article className="rounded-2xl border border-blue-100 bg-blue-50/40 p-6 text-center">
              <h3 className="text-3xl font-semibold text-[#0F172A]">{positioningColumns[2].title}</h3>
              <ul className="mt-5 space-y-4 text-xl leading-relaxed text-slate-700">
                {positioningColumns[2].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-[#0F172A] px-6 py-12 text-center md:px-8">
          <h2 className="mx-auto max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
            AI는 제안하고, 호연은 리드합니다.
          </h2>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/counseling"
              className="inline-flex min-w-40 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0F172A] transition hover:bg-blue-50"
            >
              상담 예약하기
            </Link>
            <Link
              href="https://map.naver.com/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-w-40 items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:border-blue-200 hover:text-blue-100"
            >
              찾아오시는 길
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
