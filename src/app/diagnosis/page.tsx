import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { ContractDiagnosisWidget } from "@/components/landing-premium/HeroAiWidgets";

const diagnosisAreas = [
  { title: "종합노무진단", detail: "근로계약, 임금, 근태, 징계, 퇴직 프로세스를 한 번에 점검합니다." },
  { title: "조직문화진단", detail: "갈등 원인과 소통 구조를 파악해 조직 내 분쟁 확산을 예방합니다." },
  { title: "HR프로세스진단", detail: "채용부터 평가·보상까지 운영 흐름을 정리해 실무 누수를 줄입니다." },
  { title: "기초노무진단", detail: "소규모 사업장의 필수 준수 항목을 중심으로 빠르게 리스크를 확인합니다." },
];

export default function DiagnosisPage() {
  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#f2f7fc_0%,#ffffff_40%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <header className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_50px_-42px_rgba(15,23,42,0.75)] md:grid-cols-[1.1fr_0.9fr] md:items-start md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Diagnosis</p>
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">기업 정기점검 받으셨나요?</h1>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                직원들을 위한 건강검진만큼, 기업의 인사노무에 대한 정기점검도 중요합니다.
              </p>
            </div>
            <ContractDiagnosisWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">진단 영역</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {diagnosisAreas.map((area) => (
                <article key={area.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.7)]">
                  <h3 className="text-xl font-semibold text-slate-900">{area.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{area.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white md:p-10">
            <h2 className="font-serif text-2xl md:text-4xl">잠재 리스크를 분쟁 전에 확인하세요</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">조직 상황을 알려주시면 업종과 규모에 맞는 진단 방식과 범위를 제안해드립니다.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              전문가 진단 신청
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
