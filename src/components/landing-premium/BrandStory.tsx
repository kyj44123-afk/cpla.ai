"use client";

import { motion } from "framer-motion";

const cards = [
  {
    title: "현장 중심 경험",
    body: "다양한 산업 현장에서 쌓은 실무 경험으로 복잡한 노무 이슈를 구조화합니다.",
  },
  {
    title: "정확한 실행력",
    body: "법령 해석부터 실행 설계까지 연결해, 의사결정의 품질과 속도를 높입니다.",
  },
  {
    title: "지속 가능한 체계",
    body: "단기 처방을 넘어 조직이 스스로 운영할 수 있는 인사·노무 체계를 만듭니다.",
  },
];

export default function BrandStory() {
  return (
    <motion.section
      className="bg-white px-5 py-24 md:px-8 md:py-32"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7 }}
    >
      <div className="mx-auto w-full max-w-7xl">
        <motion.p
          className="text-xs uppercase tracking-[0.2em] text-slate-500"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          Brand Story
        </motion.p>
        <motion.h2
          className="mt-3 font-serif text-3xl text-slate-900 md:text-5xl"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          공인노무사 경영진
        </motion.h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <motion.article
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6fa_100%)] p-7 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)]"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <h3 className="font-serif text-2xl text-slate-900">{card.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{card.body}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
