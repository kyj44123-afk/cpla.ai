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
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">CPLA.AI</p>
            <p className="mt-1 text-sm text-slate-600">공인노무사 기반 AI 노무 전략 플랫폼</p>
          </div>
          <p className="hidden rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 md:block">
            AI의 분석을 전문가가 완성합니다.
          </p>
        </header>

        <section className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <p className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-slate-600">
              LEGAL AUTHORITY x SAAS PRECISION
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
                기업용 서비스 안내
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/counseling"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
              >
                근로자·프리랜서 서비스 안내
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

        <section className="mt-12">
          <p className="mb-4 text-center text-lg font-semibold text-[#0F172A]">AI가 알려준 판결문 진위검증하기</p>
          <form
            action="/rightcasenumber"
            method="get"
            className="mx-auto max-w-3xl rounded-3xl border border-blue-100 bg-white p-6 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.5)]"
          >
            <p className="mb-3 text-sm text-slate-600">AI가 알려준 판결번호와 인용한 문구를 입력하세요.</p>
            <textarea
              name="input"
              required
              placeholder="예) 2023다12345&#10;“근로시간 산정은 실질적 지휘·감독 여부를 중심으로 판단한다.”"
              className="h-36 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500"
            />
            <button
              type="submit"
              className="mt-4 inline-flex rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              진위 검증 페이지로 이동
            </button>
          </form>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
          <p className="text-xs font-semibold tracking-[0.14em] text-slate-500">EXPERT WITH AI POSITIONING</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0F172A] md:text-4xl">
            법적 권위와 데이터 기반 실행력을 결합한 하이브리드 모델
          </h2>
          <p className="mt-5 inline-flex rounded-full bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white">
            공인노무사+AI 팀을 구성했습니다.
          </p>

          <div className="mt-9 grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
            <article className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
              <h3 className="text-lg font-semibold text-[#0F172A]">{positioningColumns[0].title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
                {positioningColumns[0].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="flex items-center justify-center text-3xl font-semibold text-blue-300">+</div>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-[#0F172A]">{positioningColumns[1].title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
                {positioningColumns[1].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <div className="flex items-center justify-center text-3xl font-semibold text-blue-300">+</div>

            <article className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
              <h3 className="text-lg font-semibold text-[#0F172A]">{positioningColumns[2].title}</h3>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
                {positioningColumns[2].items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-[#0F172A] px-6 py-12 text-center md:px-8">
          <h2 className="mx-auto max-w-4xl whitespace-pre-line text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
            {"생성형 AI 좋습니다.\n진짜 믿어야 할 것은 제대로 된 전문가입니다."}
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
