import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import TopHeader from "@/components/landing-premium/TopHeader";
import {
  ENTERPRISE_QUESTIONS,
  decodeAnswers,
  getDiagnosisMessage,
  getDiagnosisTier,
  getRecommendations,
  getScoreTrackLabel,
} from "@/lib/enterpriseDiagnosis";

const SCORE_POINTS = Array.from({ length: 11 }, (_, idx) => idx);

type ResultPageProps = {
  searchParams: Promise<{ answers?: string }>;
};

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const params = await searchParams;
  const answersParam = params.answers ?? "";
  const decoded = decodeAnswers(answersParam);

  const diagnosis = decoded
    ? (() => {
        const yesCount = decoded.filter(Boolean).length;
        const tier = getDiagnosisTier(decoded);
        const message = getDiagnosisMessage(tier);
        const recommendations = getRecommendations(decoded);
        return { yesCount, message, recommendations };
      })()
    : null;

  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#f2f6fb_0%,#ffffff_40%)] text-slate-900">
      <TopHeader />
      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          {diagnosis ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_48px_-40px_rgba(15,23,42,0.75)] md:p-10">
                <p className="text-center text-xs uppercase tracking-[0.2em] text-slate-500">Enterprise Diagnosis Result</p>
                <h1 className="mt-4 text-center font-serif text-3xl leading-tight text-slate-900 md:text-5xl">{diagnosis.message}</h1>
                <p className="mt-6 text-center text-lg font-semibold text-slate-700">
                  YES 답변 수: <span className="text-slate-900">{diagnosis.yesCount}</span> / {ENTERPRISE_QUESTIONS.length}
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/counseling"
                    className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    상담예약
                  </Link>
                  <Link
                    href="/enterprise-diagnosis"
                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    다시 진단하기
                  </Link>
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-center font-serif text-3xl text-slate-900 md:text-4xl">제안 서비스</h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {diagnosis.recommendations.map((service) => (
                    <article
                      key={service.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_32px_-26px_rgba(15,23,42,0.7)]"
                    >
                      <div className="relative h-52 w-full bg-[linear-gradient(180deg,#edf4fb_0%,#dce8f5_100%)]">
                        <Image src={service.image} alt={service.title} fill className="object-cover" />
                      </div>
                      <div className="p-6">
                        <h3 className="font-serif text-2xl text-slate-900">{service.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{service.summary}</p>
                        <Link
                          href={service.href}
                          className="mt-5 inline-flex items-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                        >
                          서비스 문의
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
                <h2 className="text-center font-serif text-2xl text-slate-900 md:text-3xl">YES 점수별 제안서비스 기준</h2>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                  {SCORE_POINTS.map((score) => {
                    const active = score === diagnosis.yesCount;
                    return (
                      <div
                        key={score}
                        className={`rounded-2xl border px-3 py-3 text-center ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <p className="text-sm font-bold">{score}점</p>
                        <p className="mt-1 text-xs leading-relaxed">{getScoreTrackLabel(score)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-[0_24px_48px_-40px_rgba(15,23,42,0.75)]">
              <h1 className="font-serif text-3xl text-slate-900 md:text-4xl">진단 결과를 불러올 수 없습니다.</h1>
              <p className="mt-3 text-slate-600">진단 페이지에서 다시 답변을 완료해 주세요.</p>
              <Link
                href="/enterprise-diagnosis"
                className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                진단하러 가기
              </Link>
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
