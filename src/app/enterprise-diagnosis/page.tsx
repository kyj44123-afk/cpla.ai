"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { ENTERPRISE_QUESTIONS, encodeAnswers } from "@/lib/enterpriseDiagnosis";

type Answer = boolean | null;

export default function EnterpriseDiagnosisPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>(Array(ENTERPRISE_QUESTIONS.length).fill(null));
  const [visibleCount, setVisibleCount] = useState(1);

  const allAnswered = useMemo(() => answers.every((answer) => answer !== null), [answers]);
  const answeredCount = useMemo(() => answers.filter((answer) => answer !== null).length, [answers]);
  const progress = Math.round((answeredCount / ENTERPRISE_QUESTIONS.length) * 100);

  const handleAnswer = (index: number, value: boolean) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    setVisibleCount((prev) => {
      const nextVisible = index + 2;
      return nextVisible > prev ? Math.min(nextVisible, ENTERPRISE_QUESTIONS.length) : prev;
    });
  };

  const openResult = () => {
    if (!allAnswered) return;
    const encoded = encodeAnswers(answers as boolean[]);
    router.push(`/result?answers=${encoded}`);
  };

  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#eef5fc_0%,#ffffff_42%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-6xl">
          <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_26px_50px_-42px_rgba(15,23,42,0.75)] md:p-10">
            <p className="text-center text-xs uppercase tracking-[0.22em] text-slate-500">Enterprise Diagnosis</p>
            <h1 className="mt-4 text-center font-serif text-3xl leading-tight text-slate-900 md:text-5xl">
              사업주 인사노무 리스크 진단
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-slate-600 md:text-base">
              10개의 질문에 YES 또는 NO로 답변하면, 현재 조직 상황에 맞는 맞춤형 제안 서비스를 확인할 수 있습니다.
            </p>

            <div className="mx-auto mt-7 w-full max-w-3xl">
              <div className="flex items-center justify-between text-xs text-slate-500 md:text-sm">
                <span>진행률</span>
                <span>
                  {answeredCount} / {ENTERPRISE_QUESTIONS.length}
                </span>
              </div>
              <div className="mt-2 h-2.5 w-full rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#5f7f9f_0%,#7ea2c1_100%)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </header>

          <section className="mt-7 space-y-4">
            {ENTERPRISE_QUESTIONS.slice(0, visibleCount).map((question, index) => {
              const answer = answers[index];
              return (
                <article
                  key={question}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.75)] md:p-7"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <span className="mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-900 px-2 text-sm font-semibold text-white md:h-9 md:min-w-9">
                      {index + 1}
                    </span>
                    <p className="text-base font-semibold leading-relaxed text-slate-900 md:text-xl">{question}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5 md:gap-3">
                    <button
                      type="button"
                      onClick={() => handleAnswer(index, true)}
                      className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition md:text-base ${
                        answer === true
                          ? "border-[#2f7896] bg-[#2f7896] text-white"
                          : "border-[#2f7896] bg-white text-[#2f7896] hover:bg-[#eaf3f8]"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswer(index, false)}
                      className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition md:text-base ${
                        answer === false
                          ? "border-[#ce8a12] bg-[#ce8a12] text-white"
                          : "border-[#ce8a12] bg-white text-[#ce8a12] hover:bg-[#fff5e3]"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          {allAnswered ? (
            <div className="mt-8">
              <button
                type="button"
                onClick={openResult}
                className="w-full rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.75)] transition hover:bg-slate-800 md:text-lg"
              >
                진단결과 확인하기
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
