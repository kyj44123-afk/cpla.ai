import Link from "next/link";
import EvidenceTrustSection from "@/components/landing/EvidenceTrustSection";
import Hero from "@/components/landing/Hero";
import ProcessSection from "@/components/landing/ProcessSection";
import RepeatedCtaBand from "@/components/landing/RepeatedCtaBand";
import ScenariosSection from "@/components/landing/ScenariosSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_40%,#eef3fa_100%)] text-slate-900">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 md:px-10 md:py-12">
        <header className="mb-10 flex items-center justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">CPLA + AI</p>
            <p className="mt-1 text-sm text-slate-600">공인노무사 검토 체계를 갖춘 AI 노무 솔루션</p>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500">Professional Labor Office</p>
            <p className="mt-1 text-sm text-slate-700">근거 기반 분석 · 교차 검증 · 실행 설계</p>
          </div>
        </header>

        <Hero />
        <ProcessSection />
        <ScenariosSection />
        <EvidenceTrustSection />
        <RepeatedCtaBand enableStickyMobile />

        <section
          aria-label="타겟 상세 이동 섹션"
          className="mt-12 grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:grid-cols-2 md:p-8"
        >
          <article id="enterprise" className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">기업용 안내 섹션</h2>
            <p className="mt-2 text-sm text-slate-700">
              기업용 흐름에서 조직 리스크 점검, 실행 설계, 운영 보조를 단계별로 확인할 수 있습니다.
            </p>
            <Link
              href="#"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              기업용 세부 페이지 준비 중
            </Link>
          </article>

          <article id="worker" className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">근로자·프리랜서 안내 섹션</h2>
            <p className="mt-2 text-sm text-slate-700">
              개인/프리랜서 흐름에서 상황 점검, 증빙 준비, 다음 대응 단계를 확인할 수 있습니다.
            </p>
            <Link
              href="#"
              className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              개인용 세부 페이지 준비 중
            </Link>
          </article>
        </section>

        <footer className="mt-16 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-sm text-slate-700 md:px-8">
          <h2 className="text-base font-semibold text-slate-900">대표 노무사 및 안내</h2>
          <p className="mt-3">대표 노무사: 곽영준</p>
          <p className="mt-1">연락처: 02-0000-0000 · contact@cpla.ai</p>
          <p className="mt-1">주소: 서울시 강남구 테헤란로 00</p>
          <p className="mt-1">찾아오는 길: 지도 보기</p>
        </footer>
      </div>
    </main>
  );
}
