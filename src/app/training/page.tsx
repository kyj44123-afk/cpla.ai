import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { QuizCarouselWidget } from "@/components/landing-premium/HeroAiWidgets";

const programs = [
  { title: "Workplace harassment prevention", detail: "Practical prevention program including report handling and manager role." },
  { title: "Sexual harassment prevention", detail: "Legal essentials taught with realistic case interpretation." },
  { title: "Leader-focused track", detail: "Labor leadership and conflict-prevention communication for managers." },
  { title: "Customized curriculum", detail: "Industry and role-specific program design for each client." },
];

const videos = [
  { title: "Harassment prevention sample", embedUrl: "https://www.youtube.com/embed/RfHh8fXJ0L0" },
  { title: "Sexual harassment prevention sample", embedUrl: "https://www.youtube.com/embed/QS7w4E4YQ4w" },
];

export default function TrainingPage() {
  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#edf5fc_0%,#ffffff_40%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <header className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_50px_-42px_rgba(15,23,42,0.75)] md:grid-cols-[1.1fr_0.9fr] md:items-start md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Training</p>
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">From mandatory training to custom HR programs</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                Training success comes from real execution. We design case-based programs for actual workplace use.
              </p>
            </div>
            <QuizCarouselWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Training Programs</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {programs.map((program) => (
                <article key={program.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="text-xl font-semibold text-slate-900">{program.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{program.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">Training Videos</h2>
              <p className="text-sm text-slate-500">You can replace these URLs with your own external YouTube links.</p>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {videos.map((video) => (
                <article key={video.title} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                  <div className="aspect-video w-full bg-slate-100">
                    <iframe
                      className="h-full w-full"
                      src={video.embedUrl}
                      title={video.title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                  <p className="p-4 text-sm font-semibold text-slate-800">{video.title}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white md:p-10">
            <h2 className="font-serif text-2xl md:text-4xl">Get schedule and pricing guidance</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">Share date, audience, and goals. We will propose agenda and quote.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              Request schedule and quote
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
