"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { QueryForm } from "@/components/query/QueryForm";
import { ResultView } from "@/components/result/ResultView";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

// Example questions with keywords to highlight (mixed individual & business)
const EXAMPLE_QUESTIONS = [
  { text: "을 당했는데 어떻게 해야 하나요?", keyword: "임금체불", keywordFirst: true },
  { text: "를 만들고 싶어요.", keyword: "평가보상체계", keywordFirst: true },
  { text: "를 당하면 어디에 신고하나요?", keyword: "부당해고", keywordFirst: true },
  { text: "가 필요해요.", keyword: "직장 내 괴롭힘 전문 조사자", keywordFirst: true },
  { text: " 계산은 어떻게 하나요?", keyword: "연장근로수당", keywordFirst: true },
  { text: "무단결근하면 ", keyword: "해고", keywordFirst: false, textBefore: "무단결근하면 ", textAfter: "해도 되나요?" },
  { text: "받을 수 있나요?", keyword: "보상", keywordFirst: true, textBefore: "업무 중 다쳤는데 " },
  { text: " 컨설팅 받고 싶어요.", keyword: "채용절차법", keywordFirst: true },
  { text: " 청구 방법은요?", keyword: "연차 미사용 수당", keywordFirst: true },
  { text: "은 언제 지급해야 하나요?", keyword: "퇴직금", keywordFirst: true },
];

function RotatingQuestions() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % EXAMPLE_QUESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const q = EXAMPLE_QUESTIONS[currentIndex];

  return (
    <div className="relative h-full flex items-center overflow-hidden" style={{ perspective: "200px" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ rotateX: 90, opacity: 0, y: 20 }}
          animate={{ rotateX: 0, opacity: 1, y: 0 }}
          exit={{ rotateX: -90, opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute"
          style={{ transformStyle: "preserve-3d" }}
        >
          {q.textBefore && <span className="text-slate-400">{q.textBefore}</span>}
          {q.keywordFirst ? (
            <>
              <span className="text-[#E97132] font-medium">{q.keyword}</span>
              <span className="text-slate-400">{q.text}</span>
            </>
          ) : (
            <>
              <span className="text-[#E97132] font-medium">{q.keyword}</span>
              {q.textAfter && <span className="text-slate-400">{q.textAfter}</span>}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type Step = "landing" | "query" | "thinking" | "result" | "contact" | "thankyou" | "goodbye";

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [precedents, setPrecedents] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string>("");
  const [isAnswerComplete, setIsAnswerComplete] = useState(false);

  // Load profile image from localStorage
  useEffect(() => {
    const savedImage = localStorage.getItem("cpla_profile_image");
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  // Step 1: Landing Input Click -> Go to Query Form
  const handleLandingInputClick = () => {
    setStep("query");
  };

  // Step 2: Query Form Submit -> Create Session & Stream & Go to Thinking
  const handleQuerySubmit = async (finalQuery: string) => {
    setQuery(finalQuery);
    setPrecedents([]); // Reset precedents
    setIsAnswerComplete(false); // Reset completion state
    setStep("thinking");

    try {
      // 1. Create Session
      const sessionRes = await fetch("/api/session", { method: "POST" });
      const sessionData = await sessionRes.json();
      const newSessionId = sessionData.sessionId;
      setSessionId(newSessionId);

      // 2. Start Streaming Answer
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: finalQuery }],
          sessionId: newSessionId,
        }),
      });

      // Handle Precedents Header
      const precedentsHeader = response.headers.get("X-CPLA-Precedents");
      if (precedentsHeader) {
        try {
          // Decode Base64 (Unicode safe)
          const headerJson = decodeURIComponent(escape(window.atob(precedentsHeader)));
          const parsed = JSON.parse(headerJson);
          setPrecedents(parsed);
        } catch (e) {
          console.error("Failed to parse precedents header", e);
        }
      }

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
      setIsAnswerComplete(true);
    } catch (e) {
      console.error(e);
      setAnswer("오류가 발생했습니다. 다시 시도해주세요.");
      setIsAnswerComplete(true);
    }
  };

  // Step 3: Thinking Effect (1.5s delay then show result)
  useEffect(() => {
    if (step === "thinking") {
      const timer = setTimeout(() => {
        setStep("result");
      }, 2300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 4: Result -> User Decision
  const handleSufficient = () => {
    setStep("goodbye");
  };

  const handleNeedVerification = () => {
    setStep("contact");
  };

  // Step 5: Contact Submit -> Thank You
  const handleContactSubmit = async (contactInfo: string, name: string) => {
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: contactInfo, name, query, sessionId }),
      });
      setStep("thankyou");
    } catch (err) {
      console.error(err);
      setStep("thankyou");
    }
  };

  // Reset to start
  const handleReset = () => {
    setStep("landing");
    setQuery("");
    setAnswer("");
    setSessionId("");
    setIsAnswerComplete(false);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col font-sans">
      <Header />

      <section className="flex-1 flex flex-col justify-center items-center w-full max-w-[1200px] mx-auto px-4 md:px-8 py-4 md:py-8">
        <AnimatePresence mode="wait">
          {step === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center"
            >
              <div className="space-y-4 md:space-y-6">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light text-slate-800 leading-tight tracking-tight"
                >
                  지금<br />
                  <span className="font-bold">어떤 문제</span>를<br />
                  해결해야 하나요?
                </motion.h1>
              </div>

              <div className="w-full flex flex-col items-center md:items-start mt-4 md:mt-0">
                <div className="text-[10px] md:text-xs text-slate-400 mb-2 w-full max-w-lg text-center md:text-left">
                  * 아래 입력창을 클릭하시면 입력창이 확대됩니다.
                </div>
                <div
                  onClick={handleLandingInputClick}
                  className="relative w-full max-w-lg cursor-pointer"
                >
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold text-base md:text-lg">Q.</span>
                    </div>
                    <div className="w-full bg-white border-2 border-slate-300 rounded-none py-3 md:py-4 pl-8 md:pl-10 pr-10 md:pr-12 text-sm md:text-lg text-slate-700 shadow-sm cursor-pointer h-[50px] md:h-[58px] overflow-hidden">
                      <RotatingQuestions />
                    </div>
                    <div className="absolute inset-y-0 right-0 px-4 flex items-center text-slate-400">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "query" && (
            <QueryForm
              key="query"
              initialQuery={query}
              onSubmit={(q) => handleQuerySubmit(q)} // Only query now
              onCancel={() => setStep("landing")}
              onContactClick={() => setStep("contact")}
            />
          )}

          {step === "thinking" && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col md:flex-row items-center gap-6 md:gap-12 px-4"
            >
              <div className="hidden md:flex w-48 md:w-64 h-48 md:h-64 bg-[#1a4f75] items-center justify-center text-white/50 overflow-hidden flex-shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  "프로필사진"
                )}
              </div>
              <div className="text-center md:text-left space-y-3 md:space-y-4">
                <h2 className="text-2xl md:text-4xl text-slate-800">
                  AI가 답변을 작성하고 있습니다.
                </h2>
                <p className="text-slate-500 text-sm md:text-lg leading-relaxed">
                  그리고 공인노무사 디렉터는 AI의 답변을<br />
                  <span className="text-[#E97132] font-bold">정확하게 검증</span>해드릴 수 있습니다.
                </p>
              </div>
            </motion.div>
          )}

          {step === "result" && (
            <ResultView
              key="result"
              answer={answer}
              precedents={precedents}
              onSufficient={handleSufficient}
              onNeedVerification={handleNeedVerification}
              isAnswerComplete={isAnswerComplete}
            />
          )}

          {step === "contact" && (
            <ContactForm key="contact" onSubmit={handleContactSubmit} />
          )}

          {step === "thankyou" && (
            <motion.div
              key="thankyou"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h2 className="text-3xl font-bold text-slate-800">
                연락처가 등록되었습니다!
              </h2>
              <p className="text-slate-500 text-lg">
                공인노무사 디렉터가 곧 연락드리겠습니다.<br />
                감사합니다.
              </p>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                처음으로 돌아가기
              </button>
            </motion.div>
          )}

          {step === "goodbye" && (
            <motion.div
              key="goodbye"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex-1 flex flex-col items-center justify-center text-center px-4"
            >
              {/* CPLA + AI with robot image */}
              <div className="flex items-center gap-0">
                <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold">
                  <span className="text-[#E97132]">CPLA</span>
                  <span className="text-[#1a4f75]"> + AI</span>
                </h1>
                <img
                  src="/ai-robot.png"
                  alt="AI Robot"
                  className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 object-contain"
                />
              </div>

              {/* Company Info */}
              <div className="space-y-1 mt-8 md:mt-12">
                <p className="text-lg md:text-xl font-bold">
                  <span className="text-[#1a4f75]">노무법인</span>{" "}
                  <span className="text-[#E97132]">호연</span>
                </p>
                <p className="text-sm md:text-base text-slate-600">
                  대표노무사 <span className="text-[#E97132] font-medium">곽영준</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {step !== "result" && step !== "query" && <Footer />}
    </main>
  );
}

