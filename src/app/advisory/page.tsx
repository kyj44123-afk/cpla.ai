import Link from "next/link";
import TopHeader from "@/components/landing-premium/TopHeader";
import SiteFooter from "@/components/landing-premium/SiteFooter";
import { PrecedentExplorerWidget } from "@/components/landing-premium/HeroAiWidgets";

const plans = [
  {
    name: "라이트",
    target: "이슈 빈도가 낮은 소규모 사업장",
    price: "월 39만원~",
    items: ["월 정기 자문", "기초 인사노무 문답", "긴급 이슈 1회 우선 대응"],
  },
  {
    name: "스탠다드",
    target: "인사 담당자가 있는 성장 단계 기업",
    price: "월 79만원~",
    items: ["주간 자문", "규정/서식 검토", "분쟁 징후 사전 점검"],
  },
  {
    name: "프리미엄",
    target: "다수 사업장 또는 복합 이슈 기업",
    price: "월 149만원~",
    items: ["상시 핫라인", "노무 이슈 리포트", "노사관계 전략 자문"],
  },
];

const useCases = [
  {
    title: "근로계약 체계 정비",
    detail: "직군별 근로계약서와 취업규칙을 정비해 채용 단계 분쟁 가능성을 줄인 사례",
  },
  {
    title: "징계 절차 리스크 대응",
    detail: "징계사유 입증 구조와 절차를 점검해 부당징계 분쟁으로의 확산을 예방한 사례",
  },
  {
    title: "퇴직/임금 이슈 사전 조정",
    detail: "퇴직금·수당 계산 기준을 통일해 집단 민원으로 번지기 전에 해결한 사례",
  },
];

export default function AdvisoryPage() {
  return (
    <main className="premium-landing min-h-screen bg-[linear-gradient(180deg,#eef5fc_0%,#ffffff_38%)] text-slate-900">
      <TopHeader />

      <section className="px-5 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto w-full max-w-7xl">
          <header className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_24px_50px_-42px_rgba(15,23,42,0.75)] md:grid-cols-[1.1fr_0.9fr] md:items-start md:p-10">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Advisory</p>
              <h1 className="mt-4 font-serif text-3xl leading-tight md:text-5xl">언제든 물어볼 수 있는 인사노무 파트너</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
                상시 자문 계약은 문제가 생긴 뒤 대응하는 방식이 아니라, 문제를 만들지 않는 운영 체계를 만드는 방법입니다.
              </p>
            </div>
            <PrecedentExplorerWidget />
          </header>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">자문 플랜 비교</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.name} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-500">{plan.name}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{plan.price}</p>
                  <p className="mt-2 text-sm text-slate-600">{plan.target}</p>
                  <ul className="mt-4 space-y-2 text-sm text-slate-700">
                    {plan.items.map((item) => (
                      <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-serif text-2xl text-slate-900 md:text-4xl">자문 활용 사례</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {useCases.map((item) => (
                <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-900 p-7 text-white md:p-10">
            <h2 className="font-serif text-2xl md:text-4xl">우리 회사도 자문이 필요한 단계인지 확인해보세요</h2>
            <p className="mt-3 text-sm text-slate-200 md:text-base">상황을 남겨주시면 규모와 이슈 빈도에 맞는 플랜부터 제안드립니다.</p>
            <Link href="/counseling" className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
              자문 계약 문의하기
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
