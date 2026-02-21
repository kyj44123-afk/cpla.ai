import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { ConsultingLinkWidget } from "@/components/landing-premium/HeroAiWidgets";

const processSteps = ["Data check", "AI analysis", "Expert review", "Improvement proposal"];
const consultingAreas = ["Policy cleanup", "HR system", "Workforce adjustment", "Subcontracting/dispatch", "Labor relations", "Welfare fund"];

const cases = [
  {
    title: "Compensation redesign project",
    before: "Inconsistent standards across roles caused fairness concerns.",
    after: "Role-based design improved clarity and internal acceptance.",
  },
  {
    title: "Restructuring support",
    before: "Low clarity on redeployment standards increased conflict risk.",
    after: "Procedure-based execution plan reduced dispute likelihood.",
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
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">Precise design prevents disputes</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                We combine data and on-site context to design consulting outputs that actually execute.
              </p>
            </div>
            <ConsultingLinkWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Consulting Process</h2>
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
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Consulting Areas</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {consultingAreas.map((area) => (
                <article key={area} className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-lg font-semibold text-slate-900">
                  {area}
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Representative Cases</h2>
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
            <h2 className="font-serif text-2xl md:text-4xl">Project design matters most during change</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">Share your planned changes and we will help structure execution.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Book project consultation
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
