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

  const scrollToDetail = () => {
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const openDetail = (audience: Audience) => {
    setSelectedAudience(audience);
    if (audience === "enterprise") {
      setEnterpriseStep(1);
    } else {
      setEnterpriseStep(0);
    }
    scrollToDetail();
  };

  const revealNextEnterprise = () => {
    setEnterpriseStep((prev) => {
      const next = Math.min(prev + 1, ENTERPRISE_QUESTIONS.length);
      window.setTimeout(() => {
        const target = document.getElementById(`enterprise-card-${next}`);
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 40);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-[#e8e8e8] p-2 text-[#121212]">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1660px] flex-col border border-[#bdbdbd] px-5 py-4 md:px-8 md:py-5">
        <header className="text-[22px] leading-none tracking-tight md:text-[38px]">
          DIRECTOR&nbsp; 노무법인 호연 대표노무사 곽영준&nbsp; KWAK YOUNG JUN
        </header>

        <section className="mx-auto mt-8 flex w-full max-w-[1300px] flex-col items-center justify-center">
          <div className="relative w-full text-center">
            <p className="text-[clamp(2.5rem,6.4vw,8.6rem)] font-black leading-none tracking-[0.03em] text-[#ceced0]">
              AI- PREPARED
            </p>
            <Image
              src="/ai-robot.png"
              alt="AI robot"
              width={210}
              height={210}
              className="absolute right-[6%] top-1/2 hidden h-auto w-[clamp(100px,11vw,210px)] -translate-y-1/2 md:block"
              priority
            />
          </div>

          <h1 className="mt-2 text-center text-[clamp(5.6rem,18vw,17rem)] font-black leading-[0.9] tracking-[0.01em] text-[#3797bf] drop-shadow-[0_8px_8px_rgba(0,0,0,0.22)]">
            CPLA<span className="lowercase">s</span>
          </h1>

          <div className="mt-10 grid w-full grid-cols-1 gap-6 pb-6 md:mt-14 md:grid-cols-2 md:gap-8 md:pb-4">
            <button
              type="button"
              onClick={() => openDetail("enterprise")}
              className="flex min-h-[128px] items-center gap-5 rounded-[28px] border-2 border-white bg-[#2f7896] px-6 py-6 text-left text-white shadow-[3px_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 hover:scale-[1.01] md:min-h-[165px] md:px-8"
            >
              <span className="text-[46px] leading-none md:text-[62px]">▶</span>
              <span className="text-[clamp(2rem,2.4vw,3.4rem)] font-black leading-tight tracking-tight">
                사업주 FOR ENTERPRISE
              </span>
            </button>

            <button
              type="button"
              onClick={() => openDetail("employee")}
              className="flex min-h-[128px] items-center gap-5 rounded-[28px] border-2 border-white bg-[#eba900] px-6 py-6 text-left text-white shadow-[3px_4px_8px_rgba(0,0,0,0.3)] transition-transform duration-150 hover:scale-[1.01] md:min-h-[165px] md:px-8"
            >
              <span className="text-[46px] leading-none md:text-[62px]">▶</span>
              <span className="text-[clamp(2rem,2.4vw,3.4rem)] font-black leading-tight tracking-tight">
                근로자 FOR EMPLOYEES
              </span>
            </button>
          </div>
        </section>

        <section
          ref={detailRef}
          className={`mx-auto w-full max-w-[1300px] overflow-hidden transition-all duration-150 ${
            selectedAudience ? "mt-6 max-h-[2200px] pb-8 opacity-100" : "mt-0 max-h-0 pb-0 opacity-0"
          }`}
          aria-hidden={!selectedAudience}
        >
          {selectedAudience === "enterprise" ? (
            <div className="flex flex-col gap-4 md:gap-5">
              {ENTERPRISE_QUESTIONS.slice(0, enterpriseStep).map((question, index) => {
                const isCurrent = index === enterpriseStep - 1;
                const canOpenNext = isCurrent && enterpriseStep < ENTERPRISE_QUESTIONS.length;

                return (
                  <button
                    key={question}
                    id={`enterprise-card-${index + 1}`}
                    type="button"
                    onClick={canOpenNext ? revealNextEnterprise : undefined}
                    className={`w-full rounded-[28px] border border-white bg-white/75 px-5 py-7 text-left shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-all duration-150 md:px-8 md:py-10 ${
                      canOpenNext ? "cursor-pointer active:scale-[0.995]" : "cursor-default"
                    }`}
                  >
                    <p className="text-[clamp(2rem,4.8vw,5.8rem)] font-black leading-[1.04] tracking-tight text-[#1a1a1a]">
                      {question}
                    </p>
                  </button>
                );
              })}

              {enterpriseStep >= ENTERPRISE_QUESTIONS.length ? (
                <Link
                  href="/enterprise-diagnosis"
                  className="mt-1 w-full rounded-[20px] border-2 border-white bg-[#2f7896] px-5 py-5 text-[clamp(1.15rem,2.6vw,2.2rem)] font-black text-white shadow-[0_8px_18px_rgba(0,0,0,0.22)] transition-all duration-150 hover:brightness-105 md:px-8 md:py-6"
                >
                  우리 회사 HR 안전성 진단하러 가기
                </Link>
              ) : null}
            </div>
          ) : null}

          {selectedAudience === "employee" ? (
            <div className="rounded-[28px] border border-white bg-white/75 p-6 shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-all duration-150 md:p-8">
              <p className="inline-block rounded-full bg-[#eba900] px-4 py-2 text-sm font-bold text-white">근로자 전용 안내</p>
              <h2 className="mt-4 text-[clamp(2rem,4.5vw,5rem)] font-black leading-[1.04] tracking-tight">
                근로자를 위한 맞춤 창이 열렸습니다.
              </h2>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
