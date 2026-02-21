import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { FactStructurerWidget } from "@/components/landing-premium/HeroAiWidgets";

const checklist = [
  {
    topic: "Investigation independence",
    internal: "Internal conflicts of interest can reduce trust in findings.",
    external: "External structure improves objectivity and acceptance.",
  },
  {
    topic: "Victim protection",
    internal: "Ambiguous standards can increase secondary harm risk.",
    external: "Clear protocol aligns with legal standards.",
  },
  {
    topic: "Report usability",
    internal: "Weak linkage to follow-up actions and prevention.",
    external: "Clear split of facts, reasoning, and recommendations.",
  },
];

const investigationScopes = [
  { title: "1-day investigation / 1-week report", detail: "For urgent single incidents requiring quick fact checks." },
  { title: "7-day investigation / 3-week report", detail: "For typical cases with multiple interviews and records." },
  { title: "Advanced specialist investigation", detail: "For repeated reports or culture-linked complex cases." },
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
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">External expertise for sensitive, complex issues</h1>
              <p className="mt-4 max-w-4xl text-sm leading-relaxed text-slate-600 md:text-base">
                In sensitive incidents, investigation process quality and report credibility determine outcomes.
              </p>
            </div>
            <FactStructurerWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Internal vs External Investigation Checklist</h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="grid grid-cols-3 bg-slate-50 text-sm font-semibold text-slate-700">
                <p className="p-4">Item</p>
                <p className="p-4">Internal</p>
                <p className="p-4">External</p>
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
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Investigation Scale</h2>
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
            <h2 className="font-serif text-2xl md:text-4xl">Speed and expertise change outcomes</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">Share the case outline and get a rapid scope and timeline proposal.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Request investigation
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
