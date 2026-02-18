"use client";

import { useMemo, useRef, useState } from "react";

type Answer = boolean | null;

const QUESTIONS = [
  "신규 직원이 근무를 개시할 때에 적법한 근로계약서가 작성된 상태인가요?",
  "근무시간이 1주 52시간을 초과하는 경우가 단 1명, 단 1주도 없었나요? 있었다면, 선택적근로시간제, 재량근로시간제 등 유연근무제도가 적용되고 있었나요?",
  "현행 취업규칙이 근로기준법에 따른 필수 조항들을 모두 반영하고 있나요?",
  "법정 통상임금, 평균임금을 정확하게 계산해서 임금 및 퇴직금을 지급하고 있나요?",
  "사업장에 상주하고 있는 프리랜서(3.3) 또는 하도급업체 직원이 전혀 없나요?",
  "직장 내 성희롱, 직장 내 괴롭힘 사건 발생 시 대응 프로세스를 갖고 있나요?",
  "기간제근로자, 단시간근로자, 일용직근로자를 위한 별도의 인사체계를 갖추고 있나요?",
  "인사담당자가 인사 업무만 전담하고 있나요?",
  "인사팀 또는 인사담당자가 신규 제도설계, 현행 인사체계에 대한 최신법령 반영 등의 인사기획 기능을 담당, 수행하고 있나요?",
  "인사체계에 대한 자체 점검 프로세스를 갖추고 있거나, 외부의 전문가에게 정기적으로 점검을 받고 있나요?",
] as const;

function getDiagnosisMessage(answers: boolean[]) {
  const yesCount = answers.filter(Boolean).length;
  const q8Yes = answers[7];
  const q9Yes = answers[8];

  if (yesCount === 10) {
    return "훌륭합니다! 우리 회사의 인사제도를 널리 알릴 수 있는 '인증'을 받는 건 어떨까요?";
  }

  if (yesCount >= 8 && yesCount <= 9) {
    return "우수합니다! 다만 지금 놓치고 있는 사항들을 전문가와 함께 개선해보면 어떨까요?";
  }

  if (yesCount >= 5 && yesCount <= 7 && q9Yes) {
    return "추가적인 인사기획이 필요합니다. 전문가의 도움을 받아 올해 부족한 부분을 보완해보면 어떨까요?";
  }

  if (yesCount >= 5 && yesCount <= 7 && (!q8Yes || !q9Yes)) {
    return "보통 수준입니다. 현재 존재하는 리스크를 진단받거나, 인사담당자가 기획 업무에 집중할 수 있도록 인사업무 일부를 아웃소싱하는 건 어떨까요?";
  }

  return "전문가의 도움이 절실한 상황입니다. 정확하게 진단 받고 원스톱 솔루션을 받으세요.";
}

export default function EnterpriseDiagnosisPage() {
  const resultRef = useRef<HTMLElement | null>(null);
  const [answers, setAnswers] = useState<Answer[]>(Array(QUESTIONS.length).fill(null));
  const [showResult, setShowResult] = useState(false);

  const allAnswered = useMemo(() => answers.every((answer) => answer !== null), [answers]);
  const yesCount = useMemo(() => answers.filter((answer) => answer === true).length, [answers]);

  const diagnosisMessage = useMemo(() => {
    if (!allAnswered) {
      return "";
    }
    return getDiagnosisMessage(answers as boolean[]);
  }, [allAnswered, answers]);

  const handleAnswer = (index: number, value: boolean) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setShowResult(false);
  };

  const openResult = () => {
    if (!allAnswered) {
      return;
    }

    setShowResult(true);
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
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
            {QUESTIONS.map((question, index) => {
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

          <section
            ref={resultRef}
            className={`mx-auto w-full max-w-[1500px] overflow-hidden transition-all duration-100 ${
              showResult ? "mt-4 max-h-[1000px] opacity-100" : "mt-0 max-h-0 opacity-0"
            }`}
            aria-hidden={!showResult}
          >
            <div className="rounded-[22px] border border-white bg-white px-4 py-6 shadow-[0_8px_18px_rgba(0,0,0,0.12)] md:px-7 md:py-8">
              <p className="text-[0.78rem] font-black uppercase tracking-[0.14em] text-[#2f7896] md:text-sm">Diagnosis Result</p>
              <h2 className="mt-3 text-[clamp(1.65rem,6.1vw,3.8rem)] font-black leading-tight tracking-tight text-[#1a1a1a]">
                {diagnosisMessage}
              </h2>
              <p className="mt-3 text-[clamp(1.02rem,3.7vw,1.4rem)] font-semibold text-[#3a3a3a]">YES 답변 수: {yesCount} / 10</p>
              <button
                type="button"
                className="mt-5 w-full rounded-[16px] border-2 border-white bg-[#d2ac3f] px-5 py-4 text-[clamp(1.15rem,4.8vw,2.1rem)] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-all duration-100 hover:brightness-105"
              >
                문의하기
              </button>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
