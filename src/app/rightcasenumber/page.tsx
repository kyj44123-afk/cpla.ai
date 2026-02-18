import { Suspense } from "react";
import RightCaseNumberClient from "./RightCaseNumberClient";

export default function RightCaseNumberPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_35%,#edf4ff_100%)] px-6 py-10 text-[#0F172A]">
          <div className="mx-auto w-full max-w-4xl">
            <p className="text-sm text-slate-600">페이지를 불러오는 중입니다...</p>
          </div>
        </main>
      }
    >
      <RightCaseNumberClient />
    </Suspense>
  );
}
