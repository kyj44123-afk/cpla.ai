import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { PrecedentExplorerWidget } from "@/components/landing-premium/HeroAiWidgets";

const plans = [
  {
    name: "Light",
    target: "Small teams with low issue frequency",
    price: "KRW 390k / month~",
    items: ["Monthly advisory", "Basic HR/labor Q&A", "1 urgent issue priority support"],
  },
  {
    name: "Standard",
    target: "Growing companies with HR staff",
    price: "KRW 790k / month~",
    items: ["Weekly advisory", "Policy/template review", "Pre-dispute risk checks"],
  },
  {
    name: "Premium",
    target: "Multi-site or complex issue organizations",
    price: "KRW 1.49m / month~",
    items: ["Always-on hotline", "Issue reports", "Labor strategy advisory"],
  },
];

const useCases = [
  {
    title: "Contract framework cleanup",
    detail: "Reorganized contracts and policies by role to reduce hiring-stage dispute risk.",
  },
  {
    title: "Disciplinary process hardening",
    detail: "Improved evidence and procedure integrity to prevent unfair-discipline conflicts.",
  },
  {
    title: "Exit and wage issue pre-settlement",
    detail: "Unified payout rules to avoid escalations into group complaints.",
  },
];

export default function AdvisoryPage() {
  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#eef5fc_0%,#ffffff_38%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <header className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_50px_-42px_rgba(15,23,42,0.75)] md:grid-cols-[1.1fr_0.9fr] md:items-start md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Advisory</p>
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">Your always-available labor partner</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                Ongoing advisory is not just post-issue response. It is an operating system that prevents issues before they happen.
              </p>
            </div>
            <PrecedentExplorerWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Plan Comparison</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.name} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-500">{plan.name}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{plan.price}</p>
                  <p className="mt-2 text-sm text-slate-600">{plan.target}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {plan.items.map((item) => (
                      <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Use Cases</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {useCases.map((item) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white md:p-10">
            <h2 className="font-serif text-2xl md:text-4xl">Check if advisory is the right next step</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">Share your situation and we will recommend the best-fit plan.</p>
            <Link
              href="/counseling"
              className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Request advisory contract
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
