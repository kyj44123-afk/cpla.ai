type ProductItem = {
  id: number;
  name: string;
  imagePlaceholder: string;
};

const products: ProductItem[] = [
  { id: 1, name: "노무 진단 리포트", imagePlaceholder: "이미지 준비중" },
  { id: 2, name: "근로계약 정비 패키지", imagePlaceholder: "이미지 준비중" },
  { id: 3, name: "임금체계 컨설팅", imagePlaceholder: "이미지 준비중" },
  { id: 4, name: "노사분쟁 대응 자문", imagePlaceholder: "이미지 준비중" },
  { id: 5, name: "인사규정 구축 서비스", imagePlaceholder: "이미지 준비중" },
  { id: 6, name: "기업 상시 자문 플랜", imagePlaceholder: "이미지 준비중" },
];

export default function ProductGrid() {
  return (
    <section id="products" className="bg-[#fdfefe] px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Service List</p>
        <h2 className="mt-3 font-serif text-3xl text-slate-900 md:text-5xl">대표 서비스</h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.8)]"
            >
              <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                {product.imagePlaceholder}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">{product.name}</h3>
              <button
                type="button"
                className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                aria-label={`${product.name} 담기`}
              >
                담기
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
