import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { ContractDiagnosisWidget } from "@/components/landing-premium/HeroAiWidgets";

const diagnosisAreas = [
  { title: "Comprehensive labor diagnosis", detail: "Review contracts, wages, attendance, discipline, and exit process end-to-end." },
  { title: "Culture diagnosis", detail: "Identify conflict triggers and communication gaps before escalation." },
  { title: "HR process diagnosis", detail: "Improve flow from hiring to evaluation and compensation." },
  { title: "Basic labor diagnosis", detail: "Fast compliance checks for smaller organizations." },
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
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">Have you done your regular company checkup?</h1>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                As health checkups matter for people, labor and HR checkups matter for organizations.
              </p>
            </div>
            <ContractDiagnosisWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Diagnosis Areas</h2>
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
            <h2 className="font-serif text-2xl md:text-4xl">Check risk before it becomes a dispute</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">Tell us your organization profile and we will suggest the right diagnosis scope.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Request expert diagnosis
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
