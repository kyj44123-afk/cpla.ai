"use client";

import React, { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

type Step = "landing" | "loading" | "question" | "contact" | "thankyou";

type AskResponse = {
  stage: "ask";
  question: string;
  round: number;
};

type FinalizeResponse = {
  stage: "finalize";
  recommendedService: string;
  recommendationReason: string;
  intakeSummary: string;
};

type DiscoveryResponse = AskResponse | FinalizeResponse;

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [situation, setSituation] = useState("");
  const [firstInput, setFirstInput] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [currentRound, setCurrentRound] = useState<2 | 3>(2);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [recommendationReason, setRecommendationReason] = useState("");
  const [intakeSummary, setIntakeSummary] = useState("");
  const [sessionId, setSessionId] = useState("");

  const progressText = useMemo(() => `${currentRound} / 3 단계`, [currentRound]);

  const fetchDiscovery = async (baseSituation: string, nextAnswers: string[], round: number) => {
    setStep("loading");

    const res = await fetch("/api/discovery-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        situation: baseSituation,
        answers: nextAnswers,
        round,
      }),
    });

    if (!res.ok) {
      throw new Error("failed to process discovery flow");
    }

    return (await res.json()) as DiscoveryResponse;
  };

  const handleSubmitSituation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstInput.trim()) return;

    const trimmed = firstInput.trim();
    setSituation(trimmed);
    setAnswers([]);
    setQuestionInput("");
    setSelectedService("");
    setRecommendationReason("");
    setIntakeSummary("");

    try {
      const sessionRes = await fetch("/api/session", { method: "POST" });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.sessionId || "");
    } catch (error) {
      console.error(error);
      setSessionId("");
    }

    try {
      const data = await fetchDiscovery(trimmed, [], 1);
      if (data.stage === "ask") {
        setCurrentQuestion(data.question);
        setCurrentRound(data.round === 3 ? 3 : 2);
        setStep("question");
        return;
      }
      setSelectedService(data.recommendedService);
      setRecommendationReason(data.recommendationReason);
      setIntakeSummary(data.intakeSummary);
      setStep("contact");
    } catch (error) {
      console.error(error);
      setCurrentQuestion("상황 파악에 어려움이 있어요. 최근 가장 불편했던 상황을 한 가지 사례로 적어주실 수 있을까요?");
      setCurrentRound(2);
      setStep("question");
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim()) return;

    const answer = questionInput.trim();
    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setQuestionInput("");

    try {
      const data = await fetchDiscovery(situation, nextAnswers, currentRound);
      if (data.stage === "ask") {
        setCurrentQuestion(data.question);
        setCurrentRound(data.round === 3 ? 3 : 2);
        setStep("question");
        return;
      }
      setSelectedService(data.recommendedService);
      setRecommendationReason(data.recommendationReason);
      setIntakeSummary(data.intakeSummary);
      setStep("contact");
    } catch (error) {
      console.error(error);
      setStep("contact");
    }
  };

  const handleContactSubmit = async (contactInfo: string, name: string) => {
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contactInfo,
          name,
          query: intakeSummary ? `${situation}\n${intakeSummary}` : situation,
          sessionId,
          selectedPath: answers,
          selectedService: selectedService || "전문 공인노무사 상담",
        }),
      });
    } catch (error) {
      console.error(error);
    }

    setStep("thankyou");
  };

  const handleReset = () => {
    setStep("landing");
    setSituation("");
    setFirstInput("");
    setQuestionInput("");
    setCurrentRound(2);
    setAnswers([]);
    setCurrentQuestion("");
    setSelectedService("");
    setRecommendationReason("");
    setIntakeSummary("");
    setSessionId("");
  };

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <section className="flex-1 w-full max-w-md mx-auto px-4 py-5">
        <AnimatePresence mode="wait">
          {step === "landing" && (
            <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-8">
              <h1 className="text-3xl font-light text-slate-800 leading-tight tracking-tight mb-6 text-center">
                지금 어떤 문제를
                <br />
                해결해야 하나요?
              </h1>

              <form onSubmit={handleSubmitSituation} className="space-y-4">
                <textarea
                  value={firstInput}
                  onChange={(e) => setFirstInput(e.target.value)}
                  placeholder="예: 요즘 근무 스케줄이 계약과 다르게 운영되고 있어요."
                  className="w-full h-36 border-2 border-slate-300 p-4 text-base text-slate-700 focus:outline-none focus:border-slate-700"
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-3 text-sm font-medium flex items-center justify-center gap-2">
                  다음으로 <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {step === "loading" && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-20 text-center">
              <p className="text-sm text-[#E97132] mb-3">상황 정리 중</p>
              <h2 className="text-xl font-semibold text-slate-800">질문을 구체화하고 있습니다.</h2>
            </motion.div>
          )}

          {step === "question" && (
            <motion.div key="question" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 pb-28">
              <p className="text-xs text-[#E97132] font-medium mb-2">{progressText}</p>
              <h2 className="text-2xl font-bold text-slate-800 mb-5">{currentQuestion}</h2>

              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <textarea
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="구체적인 상황을 자유롭게 입력해 주세요."
                  className="w-full h-36 border-2 border-slate-300 p-4 text-base text-slate-700 focus:outline-none focus:border-slate-700"
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-3 text-sm font-medium flex items-center justify-center gap-2">
                  {currentRound === 3 ? "서비스 연결하기" : "다음 질문"} <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 max-w-md mx-auto">
                <button
                  onClick={() => {
                    if (!selectedService) {
                      setSelectedService("전문 공인노무사 상담");
                    }
                    setStep("contact");
                  }}
                  className="w-full bg-[#E97132] text-white py-3 text-sm font-medium"
                >
                  바로 전문가에게 문의하기
                </button>
              </div>
            </motion.div>
          )}

          {step === "contact" && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6">
              {selectedService && (
                <div className="mb-5 border border-slate-200 p-4 space-y-2">
                  <p className="text-xs text-slate-400">추천 서비스</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedService}</p>
                  {recommendationReason && <p className="text-xs text-slate-500 leading-relaxed">{recommendationReason}</p>}
                </div>
              )}
              <ContactForm onSubmit={handleContactSubmit} />
            </motion.div>
          )}

          {step === "thankyou" && (
            <motion.div key="thankyou" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-16 space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">접수가 완료되었습니다.</h2>
              <p className="text-slate-500 text-sm">입력하신 내용을 바탕으로 상세 안내를 드릴 예정입니다.</p>
              <button onClick={handleReset} className="px-6 py-3 bg-slate-900 text-white text-sm">
                처음으로 돌아가기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </main>
  );
}
