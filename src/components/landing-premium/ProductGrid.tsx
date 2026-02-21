import Link from "next/link";

type ProductItem = {
  id: number;
  name: string;
  description: string;
  href: string;
  cta: string;
};

const products: ProductItem[] = [
  {
    id: 1,
    name: "노무 자문 계약",
    description: "기업 규모와 이슈 빈도에 맞춘 상시 자문 플랜으로 빠른 의사결정을 지원합니다.",
    href: "/advisory",
    cta: "자문 플랜 보기",
  },
  {
    id: 2,
    name: "기업 노무 리스크 진단",
    description: "법적 분쟁 가능성을 선제적으로 점검해 경영 리스크를 줄입니다.",
    href: "/diagnosis",
    cta: "진단 항목 보기",
  },
  {
    id: 3,
    name: "인사노무 컨설팅",
    description: "규정 정비, 임금체계 개편, 조직 변경 프로젝트를 체계적으로 수행합니다.",
    href: "/consulting",
    cta: "컨설팅 사례 보기",
  },
  {
    id: 4,
    name: "괴롭힘·성희롱 조사",
    description: "민감한 사건일수록 객관성과 신뢰를 높이는 외부 전문조사가 필요합니다.",
    href: "/harassment",
    cta: "조사 방식 확인",
  },
  {
    id: 5,
    name: "기업 교육 프로그램",
    description: "법정 의무교육부터 리더 대상 과정까지 실무 중심으로 운영합니다.",
    href: "/training",
    cta: "교육 프로그램 보기",
  },
  {
    id: 6,
    name: "빠른 상담 신청",
    description: "현재 상황을 남기면 필요한 서비스부터 우선 제안드립니다.",
    href: "/counseling",
    cta: "상담 바로 신청",
  },
];

export default function ProductGrid() {
  return (
    <section id="products" className="bg-[#fdfefe] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Service List</p>
        <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-5xl">기업 상황별 서비스</h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600 md:text-base">
          메인에서 세부 페이지로 이동해 서비스 범위와 적용 사례를 확인하고 가장 맞는 방식으로 상담을 시작하세요.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.8)]"
            >
              <p className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                0{product.id}
              </p>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{product.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{product.description}</p>
              <Link
                href={product.href}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                aria-label={`${product.name} 페이지 이동`}
              >
                {product.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
