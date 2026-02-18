"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

type Audience = "enterprise" | "employee";

const ENTERPRISE_QUESTIONS = [
  "당장 내일 근로감독이 나온다면?",
  "퇴사한 직원이 노동청에 신고한다면?",
  "직장 내 괴롭힘을 방치했다며 손해배상을 청구한다면?",
  "100% 대응 가능하신가요?",
] as const;

export default function Home() {
  const detailRef = useRef<HTMLElement | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<Audience | null>(null);
  const [enterpriseStep, setEnterpriseStep] = useState(0);

  const openDetail = (audience: Audience) => {
    setSelectedAudience(audience);
    setEnterpriseStep(audience === "enterprise" ? 1 : 0);
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const revealNextEnterprise = () => {
    setEnterpriseStep((prev) => {
      const next = Math.min(prev + 1, ENTERPRISE_QUESTIONS.length);
      window.setTimeout(() => {
        const target = document.getElementById(`enterprise-card-${next}`);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 35);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-white text-[#121212]">
      <div className="mx-auto w-full max-w-[1800px] p-2 md:p-4">
        <section className="border border-[#b9b9b9] bg-[#dfdfe1] px-4 py-4 md:px-10 md:py-8">
          <header className="text-[clamp(1rem,1.55vw,1.95rem)] font-medium leading-none tracking-tight">
            DIRECTOR&nbsp; 노무법인 호연 대표노무사 곽영준&nbsp; KWAK YOUNG JUN
          </header>

          <div className="mx-auto mt-8 w-full max-w-[1400px] text-center md:mt-10">
            <div className="relative">
              <p className="text-[clamp(2.2rem,7.2vw,8.4rem)] font-black leading-none tracking-[0.02em] text-[#c6c6cb]">
                AI- PREPARED
              </p>
              <Image
                src="/pptx-assets/robot-from-ppt.png"
                alt="AI robot"
                width={220}
                height={220}
                priority
                className="absolute right-[2%] top-1/2 hidden h-auto w-[clamp(110px,13vw,220px)] -translate-y-1/2 md:block"
              />
            </div>

            <h1 className="mt-2 text-[clamp(4.6rem,18vw,17rem)] font-black leading-[0.9] tracking-tight text-[#5c95bc] drop-shadow-[0_8px_8px_rgba(0,0,0,0.22)]">
              CPLA<span className="lowercase">s</span>
            </h1>
          </div>

          <div className="mx-auto mt-10 grid w-full max-w-[1600px] grid-cols-1 gap-5 md:mt-12 md:grid-cols-2 md:gap-10">
            <button
              type="button"
              onClick={() => openDetail("enterprise")}
              className="flex min-h-[120px] items-center gap-5 rounded-[28px] border-2 border-white bg-[#5b84a3] px-6 py-6 text-left text-white shadow-[0_4px_10px_rgba(0,0,0,0.24)] transition-all duration-100 hover:brightness-105 md:min-h-[190px] md:px-12"
            >
              <span className="text-[clamp(2rem,3.8vw,4.8rem)] leading-none">▶</span>
              <span className="text-[clamp(2rem,3.2vw,4.25rem)] font-black leading-none tracking-tight">사업주 FOR ENTERPRISE</span>
            </button>

            <button
              type="button"
              onClick={() => openDetail("employee")}
              className="flex min-h-[120px] items-center gap-5 rounded-[28px] border-2 border-white bg-[#d2ac3f] px-6 py-6 text-left text-white shadow-[0_4px_10px_rgba(0,0,0,0.24)] transition-all duration-100 hover:brightness-105 md:min-h-[190px] md:px-12"
            >
              <span className="text-[clamp(2rem,3.8vw,4.8rem)] leading-none">▶</span>
              <span className="text-[clamp(2rem,3.2vw,4.25rem)] font-black leading-none tracking-tight">근로자 FOR EMPLOYEES</span>
            </button>
          </div>
        </section>

        <section
          ref={detailRef}
          className={`mx-auto w-full max-w-[1600px] overflow-hidden transition-all duration-100 ${
            selectedAudience ? "mt-2 max-h-[8000px] opacity-100" : "mt-0 max-h-0 opacity-0"
          }`}
          aria-hidden={!selectedAudience}
        >
          {selectedAudience === "enterprise" ? (
            <div className="flex flex-col gap-2">
              {ENTERPRISE_QUESTIONS.slice(0, enterpriseStep).map((question, index) => {
                const isCurrent = index === enterpriseStep - 1;
                const canOpenNext = isCurrent && enterpriseStep < ENTERPRISE_QUESTIONS.length;

                return (
                  <button
                    key={question}
                    id={`enterprise-card-${index + 1}`}
                    type="button"
                    onClick={canOpenNext ? revealNextEnterprise : undefined}
                    className={`flex min-h-[92dvh] w-full items-center rounded-[26px] border border-[#e6e6e6] bg-[#f5f5f6] px-5 py-8 text-left shadow-[0_6px_14px_rgba(0,0,0,0.14)] transition-all duration-100 md:min-h-[320px] md:px-10 ${
                      canOpenNext ? "cursor-pointer active:scale-[0.995]" : "cursor-default"
                    }`}
                  >
                    <p className="text-[clamp(2.25rem,9vw,6rem)] font-black leading-[1.05] tracking-tight text-[#161616]">{question}</p>
                  </button>
                );
              })}

              {enterpriseStep >= ENTERPRISE_QUESTIONS.length ? (
                <Link
                  href="/enterprise-diagnosis"
                  className="flex min-h-[20dvh] items-center justify-center rounded-[20px] border-2 border-white bg-[#2f7896] px-6 py-6 text-center text-[clamp(1.35rem,5.6vw,2.8rem)] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] transition-all duration-100 hover:brightness-105"
                >
                  우리 회사 HR 안전성 진단하러 가기
                </Link>
              ) : null}
            </div>
          ) : null}

          {selectedAudience === "employee" ? (
            <article className="flex min-h-[92dvh] items-center rounded-[26px] border border-[#e6e6e6] bg-[#f5f5f6] px-5 py-8 shadow-[0_6px_14px_rgba(0,0,0,0.14)] md:min-h-[420px] md:px-10">
              <h2 className="text-[clamp(2.1rem,8.6vw,5rem)] font-black leading-[1.05] tracking-tight text-[#161616]">
                근로자를 위한 맞춤 창이 열렸습니다.
              </h2>
            </article>
          ) : null}
        </section>
      </div>
    </main>
  );
}
