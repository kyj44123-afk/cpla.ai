"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ENTERPRISE_QUESTIONS, encodeAnswers } from "@/lib/enterpriseDiagnosis";

type Answer = boolean | null;

export default function EnterpriseDiagnosisPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answer[]>(Array(ENTERPRISE_QUESTIONS.length).fill(null));
  const [visibleCount, setVisibleCount] = useState(1);

  const allAnswered = useMemo(() => answers.every((answer) => answer !== null), [answers]);

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
    <main className="min-h-screen bg-white text-[#111111]">
      <div className="mx-auto w-full max-w-[1800px] p-2 md:p-4">
        <section className="border border-[#d2d2d2] bg-[#f7f7f8] px-4 py-6 md:px-8 md:py-9">
          <header className="mx-auto w-full max-w-[1500px]">
            <p className="text-[0.78rem] font-black uppercase tracking-[0.14em] text-[#2f7896] md:text-sm">Enterprise Diagnosis</p>
            <h1 className="mt-2 text-[clamp(2rem,7vw,5.2rem)] font-black leading-none tracking-tight">사업주 진단 페이지</h1>
            <p className="mt-3 text-[clamp(1.05rem,3.9vw,1.7rem)] font-semibold text-[#2e2e2e]">10개 질문에 YES 또는 NO로 답변해 주세요.</p>
          </header>

          <section className="mx-auto mt-5 flex w-full max-w-[1500px] flex-col gap-3 md:gap-4">
            {ENTERPRISE_QUESTIONS.slice(0, visibleCount).map((question, index) => {
              const answer = answers[index];
              return (
                <article
                  key={question}
                  className="rounded-[22px] border border-white bg-white px-4 py-5 shadow-[0_6px_14px_rgba(0,0,0,0.08)] md:px-7 md:py-7"
                >
                  <p className="text-[clamp(1.12rem,4.6vw,2.1rem)] font-black leading-snug tracking-tight text-[#171717]">
                    {index + 1}. {question}
                  </p>
                  <div className="mt-4 flex gap-2.5 md:gap-3">
                    <button
                      type="button"
                      onClick={() => handleAnswer(index, true)}
                      className={`rounded-[14px] border-2 px-5 py-2.5 text-[clamp(1rem,3.8vw,1.2rem)] font-black transition-all duration-100 ${
                        answer === true
                          ? "border-[#2f7896] bg-[#2f7896] text-white"
                          : "border-[#2f7896] bg-white text-[#2f7896]"
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswer(index, false)}
                      className={`rounded-[14px] border-2 px-5 py-2.5 text-[clamp(1rem,3.8vw,1.2rem)] font-black transition-all duration-100 ${
                        answer === false
                          ? "border-[#ce8a12] bg-[#ce8a12] text-white"
                          : "border-[#ce8a12] bg-white text-[#ce8a12]"
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </article>
              );
            })}

            {allAnswered ? (
              <button
                type="button"
                onClick={openResult}
                className="w-full rounded-[18px] border-2 border-white bg-[#2f7896] px-5 py-5 text-[clamp(1.25rem,5.2vw,2.4rem)] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.2)] transition-all duration-100 hover:brightness-105"
              >
                진단결과 바로 보기
              </button>
            ) : null}
          </section>
        </section>
      </div>
    </main>
  );
}
