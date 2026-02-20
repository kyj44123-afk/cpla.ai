import Image from "next/image";

const concernCards = [
  {
    title: "지속적인 인력유출",
    description: "핵심 인재 이탈이 반복되면 조직 학습과 실행력이 동시에 약화됩니다.",
    image: "/landing/concern-turnover.svg",
  },
  {
    title: "언제 터질지 모르는 인사노무 리스크",
    description: "작은 신호를 놓치면 분쟁과 비용이 한 번에 폭발할 수 있습니다.",
    image: "/landing/concern-risk.svg",
  },
  {
    title: "성장률은 둔화, 인건비는 우상향",
    description: "매출과 인건비의 간극이 커질수록 경영 의사결정은 더 어려워집니다.",
    image: "/landing/concern-cost.svg",
  },
];

const solutionFlow = [
  {
    step: "1",
    title: "인사노무 진단을 통한 이직원인 파악",
    image: "/landing/solution-diagnosis.svg",
  },
  {
    step: "2",
    title: "근본적 문제해결까지 필요한 노동법률자문",
    image: "/landing/solution-advisory.svg",
  },
  {
    step: "3",
    title: "임금체계/적정인력 등 HRBP 컨설팅",
    image: "/landing/solution-hrbp.svg",
  },
];

const aiWorks = [
  "1. 고도화된 AI 분석 Tool",
  "2. Expert in the Loop",
  "3. 창조적 인사이트 확장",
];

export default function HeroFollowupSections() {
  return (
    <div className="bg-white">
      <section className="px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="text-center font-serif text-3xl text-slate-900 md:text-5xl">
            기업이 성장할수록 깊어지는 고민
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {concernCards.map((card) => (
              <article
                key={card.title}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_16px_30px_-24px_rgba(15,23,42,0.7)]"
              >
                <div className="relative h-48 w-full bg-[linear-gradient(180deg,#eef5fc_0%,#f8fbff_100%)]">
                  <Image src={card.image} alt={card.title} fill className="object-cover" />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl leading-snug text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{card.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="text-center font-serif text-3xl text-slate-900 md:text-5xl">이렇게 해결할 수 있습니다</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {solutionFlow.map((item, index) => (
              <article
                key={item.title}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,#f9fcff_0%,#f2f6fb_100%)] p-6 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.7)]"
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
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-8 md:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-center text-xs uppercase tracking-[0.18em] text-slate-500">Leading with</p>
          <h2 className="mt-5 text-center font-serif text-5xl text-slate-900 md:text-7xl">노무법인 호연</h2>
        </div>
      </section>

      <section className="px-5 pb-24 md:px-8 md:pb-28">
        <div className="mx-auto w-full max-w-7xl">
          <h2 className="text-center font-serif text-3xl text-slate-900 md:text-5xl">AI works</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
            {aiWorks.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] p-6 text-center shadow-[0_14px_26px_-26px_rgba(15,23,42,0.8)]"
              >
                <p className="text-base font-medium leading-relaxed text-slate-800 md:text-lg">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
