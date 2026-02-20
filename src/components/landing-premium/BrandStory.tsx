const cards = [
  {
    title: "풍부한 경험",
    body: "산업 현장과 기업 자문을 아우른 실무 경험으로 복잡한 노무 이슈를 명확하게 정리합니다.",
  },
  {
    title: "압도적 실력",
    body: "법률 해석과 분쟁 대응의 정밀도를 높여 중요한 의사결정 순간에 가장 실질적인 대안을 제시합니다.",
  },
  {
    title: "지속가능경영",
    body: "단기 해결을 넘어 조직이 오래 유지할 수 있는 인사·노무 체계를 함께 설계합니다.",
  },
];

export default function BrandStory() {
  return (
    <section className="bg-white px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Brand Story</p>
        <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-5xl">공인노무사 곽영준</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#f3f6fa_100%)] p-7 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.6)]"
            >
              <h3 className="font-serif text-2xl text-slate-900">{card.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 md:text-base">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
