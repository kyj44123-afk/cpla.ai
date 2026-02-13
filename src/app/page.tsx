"use client";

import React, { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

type Step = "landing" | "discovery" | "analyzing" | "recommendations" | "contact" | "thankyou";

type ServiceOption = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

type DiscoveryAnswer = {
  category: string;
  urgency: string;
  goal: string;
};

const QUICK_QUESTIONS = [
  {
    id: "category",
    label: "1단계 · 어떤 상황에 가깝나요?",
    choices: ["개인 근로자 문제", "사업장/HR 운영", "직장 내 분쟁 대응"],
  },
  {
    id: "urgency",
    label: "2단계 · 얼마나 급한가요?",
    choices: ["오늘/이번 주 내 대응 필요", "이번 달 안에 정리", "우선 정보 탐색"],
  },
  {
    id: "goal",
    label: "3단계 · 지금 가장 원하는 결과는?",
    choices: ["법적 리스크 점검", "문제 해결 절차 안내", "노무사 직접 상담 연결"],
  },
] as const;

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<DiscoveryAnswer>({ category: "", urgency: "", goal: "" });
  const [selectedOption, setSelectedOption] = useState<ServiceOption | null>(null);

  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sessionId, setSessionId] = useState<string>("");

  const recommendations = useMemo<ServiceOption[]>(() => {
    const summary = `${answers.category} / ${answers.urgency} / ${answers.goal}`;

    return [
      {
        id: "risk-check",
        title: "리스크 진단 + 핵심 쟁점 정리",
        description: "현재 상황에서 위법 가능성, 증거 포인트, 우선순위를 빠르게 정리합니다.",
        prompt: `다음 조건의 노무 이슈를 점검해 주세요: ${summary}.\n핵심 리스크 3가지와 바로 실행할 체크리스트를 알려주세요.`,
      },
      {
        id: "procedure-guide",
        title: "절차 중심 대응 가이드",
        description: "신고·구제·협의 등 어떤 순서로 진행해야 하는지 실무 절차를 제시합니다.",
        prompt: `다음 조건의 노무 이슈에 대한 절차 가이드를 작성해 주세요: ${summary}.\n준비서류, 예상 일정, 주의사항을 포함해 주세요.`,
      },
      {
        id: "direct-consult",
        title: "노무사 직접 상담 연계 준비",
        description: "전문가 상담 전, 질문지와 준비자료를 정리해 상담 효율을 높입니다.",
        prompt: `다음 조건으로 공인노무사 상담을 준비하고 싶습니다: ${summary}.\n상담 전 준비사항과 꼭 물어볼 질문을 정리해 주세요.`,
      },
    ];
  }, [answers]);

  const handleLandingStart = () => {
    setStep("discovery");
    setCurrentQuestionIndex(0);
    setAnswers({ category: "", urgency: "", goal: "" });
    setSelectedOption(null);
    setQuery("");
    setAnswer("");
    setSessionId("");
  };

  const handleChoose = (value: string) => {
    const key = QUICK_QUESTIONS[currentQuestionIndex].id;
    setAnswers((prev) => ({ ...prev, [key]: value }));

    if (currentQuestionIndex < QUICK_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    setStep("recommendations");
  };

  const runRecommendation = async (option: ServiceOption) => {
    setSelectedOption(option);
    setQuery(option.prompt);
    setAnswer("");
    setStep("analyzing");

    try {
      const sessionRes = await fetch("/api/session", { method: "POST" });
      const sessionData = await sessionRes.json();
      const newSessionId = sessionData.sessionId;
      setSessionId(newSessionId);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: option.prompt }],
          sessionId: newSessionId,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        fullText += chunkValue;
        setAnswer(fullText);
      }

      setStep("contact");
    } catch (e) {
      console.error(e);
      setAnswer("오류가 발생했습니다. 다시 시도해주세요.");
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
          query,
          sessionId,
          selectedService: selectedOption?.title,
          discoveryAnswers: answers,
          recommendationPreview: answer,
        }),
      });
    } catch (err) {
      console.error(err);
    }

    setStep("thankyou");
  };

  const question = QUICK_QUESTIONS[currentQuestionIndex];

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <section className="flex-1 flex flex-col justify-center items-center w-full max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-10">
        <AnimatePresence mode="wait">
          {step === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
            >
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-light text-slate-800 leading-tight tracking-tight">
                  3단계 질문으로<br />
                  <span className="font-bold">딱 맞는 노무 서비스</span>를<br />
                  찾아드릴게요.
                </h1>
                <p className="text-slate-500">
                  기존 CPLA + AI 흐름은 그대로 유지하고, 먼저 고객님 상황에 맞는 서비스를 정확히 분류합니다.
                </p>
              </div>

              <div className="w-full flex flex-col items-center md:items-start mt-2">
                <div className="text-xs text-slate-400 mb-2 w-full max-w-lg">* 클릭하면 3단계 진단이 시작됩니다.</div>
                <button onClick={handleLandingStart} className="relative w-full max-w-lg text-left">
                  <div className="w-full bg-white border-2 border-slate-300 py-4 pl-4 pr-12 text-base text-slate-700 shadow-sm h-[58px] overflow-hidden hover:border-slate-500 transition-colors">
                    접속 목적을 빠르게 진단하러 가기
                  </div>
                  <div className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === "discovery" && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="w-full max-w-3xl"
            >
              <div className="mb-8 text-center">
                <p className="text-[#E97132] text-sm font-medium mb-2">CPLA Discovery</p>
                <h2 className="text-2xl md:text-4xl font-bold text-slate-800">{question.label}</h2>
              </div>

              <div className="grid gap-3">
                {question.choices.map((choice) => (
                  <button
                    key={choice}
                    onClick={() => handleChoose(choice)}
                    className="w-full border border-slate-200 py-4 px-5 text-left hover:border-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="w-full max-w-4xl"
            >
              <div className="mb-8 text-center">
                <p className="text-[#E97132] text-sm font-medium">진단 완료</p>
                <h2 className="text-2xl md:text-4xl font-bold text-slate-800">추천 서비스 3가지 중 선택해 주세요</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {recommendations.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => runRecommendation(option)}
                    className="border border-slate-200 p-5 text-left hover:border-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{option.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{option.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center px-4"
            >
              <h2 className="text-2xl md:text-4xl text-slate-800 mb-4">선택하신 서비스에 맞춰 AI가 분석 중입니다.</h2>
              <p className="text-slate-500">OpenAI + 국가법령정보센터 데이터를 기존 방식으로 연동해 안내 초안을 준비하고 있어요.</p>
            </motion.div>
          )}

          {step === "contact" && (
            <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-8">
              {selectedOption && (
                <div className="max-w-3xl mx-auto border border-slate-200 p-5">
                  <p className="text-xs text-slate-400 mb-2">선택 서비스</p>
                  <h3 className="text-lg font-bold text-slate-800">{selectedOption.title}</h3>
                  <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{answer || "분석 결과를 불러오는 중입니다..."}</p>
                </div>
              )}
              <ContactForm onSubmit={handleContactSubmit} />
            </motion.div>
          )}

          {step === "thankyou" && (
            <motion.div key="thankyou" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h2 className="text-3xl font-bold text-slate-800">연락처가 등록되었습니다!</h2>
              <p className="text-slate-500 text-lg">선택하신 서비스 기준으로 공인노무사 디렉터가 상세하게 연락드리겠습니다.</p>
              <button onClick={() => setStep("landing")} className="px-8 py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors">
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
