import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { QuizCarouselWidget } from "@/components/landing-premium/HeroAiWidgets";

const programs = [
  { title: "직장 내 괴롭힘 예방", detail: "신고 대응과 관리자 역할을 포함한 실무형 예방 교육" },
  { title: "성희롱 예방", detail: "법정 필수 내용을 실제 사례 중심으로 해석한 교육" },
  { title: "리더 대상 과정", detail: "관리자 대상 노무 리더십과 분쟁 예방 커뮤니케이션" },
  { title: "고객 맞춤 교육 설계", detail: "업종·직무 특성에 맞춘 커스텀 교육 커리큘럼 설계" },
];

const videos = [
  { title: "괴롭힘 예방 교육 샘플", embedUrl: "https://www.youtube.com/embed/RfHh8fXJ0L0" },
  { title: "성희롱 예방 교육 샘플", embedUrl: "https://www.youtube.com/embed/QS7w4E4YQ4w" },
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
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">법정 의무교육부터 맞춤형 HR 교육까지</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                교육은 이수 자체보다 현장 적용이 중요합니다. 사례 중심으로 바로 실행 가능한 내용을 제공합니다.
              </p>
            </div>
            <QuizCarouselWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">교육 프로그램</h2>
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
              <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">교육 영상</h2>
              <p className="text-sm text-slate-500">유튜브 URL 교체만으로 같은 섹션에서 운영할 수 있습니다.</p>
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
            <h2 className="font-serif text-2xl md:text-4xl">교육 일정과 견적을 빠르게 안내해드립니다</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">희망 일정, 대상 인원, 교육 목적을 알려주시면 맞춤안으로 제안드립니다.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              교육 일정 및 견적 문의
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
