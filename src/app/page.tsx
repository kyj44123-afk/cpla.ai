"use client";

import React, { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

type Step = "landing" | "loading-options" | "options" | "contact" | "thankyou";

type OptionResponse = {
  question: string;
  options: string[];
  isFinalRound: boolean;
};

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [situation, setSituation] = useState("");
  const [input, setInput] = useState("");
  const [round, setRound] = useState(1);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [isFinalRound, setIsFinalRound] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [sessionId, setSessionId] = useState("");

  const progressText = useMemo(() => {
    if (isFinalRound) return "최종 서비스 선택";
    return `${round + 1} / 3 단계`;
  }, [isFinalRound, round]);

  const fetchOptions = async (baseSituation: string, nextPath: string[], nextRound: number) => {
    setStep("loading-options");

    try {
      const res = await fetch("/api/discovery-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situation: baseSituation,
          selectedPath: nextPath,
          round: nextRound,
        }),
      });

      if (!res.ok) throw new Error("failed to load options");

      const data = (await res.json()) as OptionResponse;
      setCurrentQuestion(data.question || "");
      setOptions(data.options || []);
      setIsFinalRound(Boolean(data.isFinalRound));
      setRound(nextRound);
      setStep("options");
    } catch (error) {
      console.error(error);
      setCurrentQuestion("입력하신 상황을 기준으로 어떤 방향이 가장 적절한지 확인해볼까요?");
      setOptions(["다시 시도하기", "바로 전문가에게 문의하기", "처음으로 돌아가기"]);
      setIsFinalRound(nextRound >= 2);
      setStep("options");
    }
  };

  const handleSubmitSituation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const trimmed = input.trim();
    setSituation(trimmed);
    setSelectedPath([]);
    setSelectedService("");
    setCurrentQuestion("");

    try {
      const sessionRes = await fetch("/api/session", { method: "POST" });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.sessionId || "");
    } catch (error) {
      console.error(error);
      setSessionId("");
    }

    await fetchOptions(trimmed, [], 1);
  };

  const handleSelectOption = async (choice: string) => {
    const nextPath = [...selectedPath, choice];
    setSelectedPath(nextPath);

    if (isFinalRound) {
      setSelectedService(choice);
      setStep("contact");
      return;
    }

    await fetchOptions(situation, nextPath, round + 1);
  };

  const handleContactSubmit = async (contactInfo: string, name: string) => {
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: contactInfo,
          name,
          query: situation,
          sessionId,
          selectedPath,
          selectedService,
        }),
      });
    } catch (error) {
      console.error(error);
    }

    setStep("thankyou");
  };

  const handleReset = () => {
    setStep("landing");
    setInput("");
    setSituation("");
    setRound(1);
    setSelectedPath([]);
    setOptions([]);
    setIsFinalRound(false);
    setCurrentQuestion("");
    setSelectedService("");
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
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="예: 임금체불을 해결해야 해요."
                  className="w-full h-36 border-2 border-slate-300 p-4 text-base text-slate-700 focus:outline-none focus:border-slate-700"
                />
                <button type="submit" className="w-full bg-slate-900 text-white py-3 text-sm font-medium flex items-center justify-center gap-2">
                  다음으로 <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {step === "loading-options" && (
            <motion.div key="loading-options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-20 text-center">
              <p className="text-sm text-[#E97132] mb-3">AI 분류 중</p>
              <h2 className="text-xl font-semibold text-slate-800">상황을 해석해서 선택지를 만드는 중입니다.</h2>
            </motion.div>
          )}

          {step === "options" && (
            <motion.div key="options" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 pb-28">
              <p className="text-xs text-[#E97132] font-medium mb-2">{progressText}</p>
              <h2 className="text-2xl font-bold text-slate-800 mb-5">
                {currentQuestion || (isFinalRound ? "전문가인 공인노무사에게 어떤 도움을 받고 싶나요?" : "해당되는 항목을 선택해 주세요")}
              </h2>

              <div className="space-y-3">
                {options.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleSelectOption(choice)}
                    className="w-full border border-slate-200 p-4 text-left text-sm text-slate-800 hover:border-slate-500"
                  >
                    {choice}
                  </button>
                ))}
              </div>

              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 max-w-md mx-auto">
                <button onClick={() => setStep("contact")} className="w-full bg-[#E97132] text-white py-3 text-sm font-medium">
                  바로 전문가에게 문의하기
                </button>
              </div>
            </motion.div>
          )}

          {step === "contact" && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-6">
              {selectedService && (
                <div className="mb-5 border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 mb-1">선택 서비스</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedService}</p>
                </div>
              )}
              <ContactForm onSubmit={handleContactSubmit} />
            </motion.div>
          )}

          {step === "thankyou" && (
            <motion.div key="thankyou" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-16 space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">접수가 완료되었습니다.</h2>
              <p className="text-slate-500 text-sm">입력하신 내용 기준으로 상세 안내를 드릴 예정입니다.</p>
              <button onClick={handleReset} className="px-6 py-3 bg-slate-900 text-white text-sm">처음으로 돌아가기</button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <Footer />
    </main>
  );
}
