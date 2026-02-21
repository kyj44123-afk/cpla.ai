"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const concernCards = [
  {
    title: "반복되는 인력 이탈",
    description: "핵심 인력이 빠져나가면 채용과 온보딩 비용이 동시에 증가합니다.",
    image: "/landing/concern-turnover.svg",
  },
  {
    title: "늦게 보이는 인사 리스크",
    description: "초기 신호를 놓치면 분쟁과 비용이 한 번에 확대될 수 있습니다.",
    image: "/landing/concern-risk.svg",
  },
  {
    title: "상승하는 인건비 부담",
    description: "급여, 수당, 운영비가 누적되면서 의사결정 속도가 느려집니다.",
    image: "/landing/concern-cost.svg",
  },
];

const solutionFlow = [
  {
    step: "1",
    title: "현황 진단으로 리스크 파악",
    image: "/landing/solution-diagnosis.svg",
  },
  {
    step: "2",
    title: "노무 자문으로 해결안 설계",
    image: "/landing/solution-advisory.svg",
  },
  {
    step: "3",
    title: "HRBP 컨설팅으로 실행 정착",
    image: "/landing/solution-hrbp.svg",
  },
];

export default function HeroFollowupSections() {
  return (
    <div className="bg-white">
      <motion.section
        className="px-5 py-20 md:px-8 md:py-24"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7 }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <motion.h2
            className="text-center font-serif text-3xl text-slate-900 md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
          >
            기업의 성장 발목을 잡는 노무 이슈
          </motion.h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {concernCards.map((card, index) => (
              <motion.article
                key={card.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_30px_-24px_rgba(15,23,42,0.7)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="relative h-48 w-full bg-[linear-gradient(180deg,#eef5fc_0%,#f8fbff_100%)]">
                  <Image src={card.image} alt={card.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl leading-snug text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{card.description}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-20 md:px-8 md:py-24"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7 }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <motion.h2
            className="text-center font-serif text-3xl text-slate-900 md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
          >
            해결 프로세스
          </motion.h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {solutionFlow.map((item, index) => (
              <motion.article
                key={item.title}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f9fcff_0%,#f2f6fb_100%)] p-6 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.7)]"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <span className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                  {item.step}
                </span>
                <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-white/80">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <h3 className="mt-5 text-lg font-semibold leading-snug text-slate-900 md:text-xl">{item.title}</h3>
                {index < solutionFlow.length - 1 ? (
                  <span className="pointer-events-none absolute -right-4 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 md:inline-flex">
                    →
                  </span>
                ) : null}
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="px-5 py-20 md:px-8 md:py-24"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.65 }}
      >
        <div className="mx-auto w-full max-w-7xl">
          <motion.p
            className="text-center text-xs uppercase tracking-[0.18em] text-slate-500"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
          >
            Leading with
          </motion.p>
          <motion.h2
            className="mt-5 text-center font-serif text-5xl text-slate-900 md:text-7xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            노무법인 인연
          </motion.h2>
        </div>
      </motion.section>
    </div>
  );
}
