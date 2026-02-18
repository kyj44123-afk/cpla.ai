"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type VerifyResponse = {
  matched: boolean;
  verdict: "matched" | "unmatched";
  reason: string;
  case?: {
    id: string;
    title: string;
    caseNumber: string;
    court: string;
    judgeDate: string;
  };
  evidence?: {
    exactContained: boolean;
    overlapRatio: number;
    confidence: number;
    snippet: string;
  };
  note?: string;
  candidates?: Array<{
    title: string;
    caseNumber: string;
    court: string;
    judgeDate: string;
  }>;
  error?: string;
};

function extractCaseNumber(input: string): string {
  const pattern = /((?:19|20)\d{2}\s*[가-힣A-Za-z]{1,6}\s*\d{1,10})/;
  const match = input.match(pattern);
  return match ? match[1].replace(/\s+/g, "") : "";
}

function parseInputBlock(rawInput: string) {
  const caseNumber = extractCaseNumber(rawInput);
  const quotedText = caseNumber ? rawInput.replace(caseNumber, "").trim() : rawInput.trim();
  return { caseNumber, quotedText };
}

export default function RightCaseNumberPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialInput = searchParams.get("input") || "";
  const initialCase = searchParams.get("caseNumber") || "";
  const initialQuote = searchParams.get("quotedText") || "";

  const parsedFromInput = useMemo(() => parseInputBlock(initialInput), [initialInput]);
  const [caseNumber, setCaseNumber] = useState(initialCase || parsedFromInput.caseNumber);
  const [quotedText, setQuotedText] = useState(initialQuote || parsedFromInput.quotedText);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    if (!caseNumber || !quotedText) return;

    let active = true;
    const run = async () => {
      setLoading(true);
      setResult(null);
      try {
        const res = await fetch("/api/rightcasenumber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ caseNumber, quotedText }),
        });
        const data = (await res.json()) as VerifyResponse;
        if (active) setResult(data);
      } catch {
        if (active) {
          setResult({ error: "검증 요청 중 오류가 발생했습니다." } as VerifyResponse);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [caseNumber, quotedText]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextCase = caseNumber.trim();
    const nextQuote = quotedText.trim();
    if (!nextCase || !nextQuote) return;

    const params = new URLSearchParams();
    params.set("caseNumber", nextCase);
    params.set("quotedText", nextQuote);
    router.push(`/rightcasenumber?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_35%,#edf4ff_100%)] px-6 py-10 text-[#0F172A]">
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">판결문 진위 검증</h1>
        <p className="mt-3 text-sm text-slate-600">
          사건번호와 인용문이 국가법령정보센터 판례 본문과 일치하는지 1차 정합성을 검사합니다.
        </p>

        <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <label htmlFor="caseNumber" className="text-sm font-semibold text-slate-700">
              사건번호
            </label>
            <input
              id="caseNumber"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="예: 2023다12345"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 transition focus:border-blue-500"
            />
          </div>

          <div className="mt-4">
            <label htmlFor="quotedText" className="text-sm font-semibold text-slate-700">
              인용 문구
            </label>
            <textarea
              id="quotedText"
              value={quotedText}
              onChange={(e) => setQuotedText(e.target.value)}
              placeholder="AI가 제시한 판결 인용 문구를 붙여 넣으세요."
              className="mt-2 h-40 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm leading-relaxed outline-none ring-0 transition focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex rounded-xl bg-[#0F172A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            진위 검증 실행
          </button>
        </form>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          {loading && <p className="text-sm text-slate-600">국가법령정보센터 API로 검증 중입니다...</p>}

          {!loading && result?.error && <p className="text-sm font-medium text-red-600">{result.error}</p>}

          {!loading && result && !result.error && (
            <div className="space-y-3 text-sm text-slate-700">
              <p className={`text-base font-semibold ${result.matched ? "text-emerald-700" : "text-amber-700"}`}>
                {result.matched ? "일치 가능성이 높습니다." : "불일치 가능성이 있습니다."}
              </p>
              <p>{result.reason}</p>
              {result.case && (
                <p className="text-slate-600">
                  {result.case.caseNumber} · {result.case.title} · {result.case.court} {result.case.judgeDate}
                </p>
              )}
              {result.evidence && (
                <>
                  <p className="text-slate-600">
                    일치도: {Math.round(result.evidence.overlapRatio * 100)}% · 신뢰도:{" "}
                    {Math.round(result.evidence.confidence * 100)}%
                  </p>
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
                    근거 스니펫: {result.evidence.snippet || "추출된 근거 스니펫이 없습니다."}
                  </p>
                </>
              )}
              {result.candidates && result.candidates.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 font-semibold text-slate-800">유사 사건번호 후보</p>
                  {result.candidates.map((c) => (
                    <p key={`${c.caseNumber}-${c.title}`} className="text-xs text-slate-600">
                      {c.caseNumber} · {c.title}
                    </p>
                  ))}
                </div>
              )}
              {result.note && <p className="text-xs text-slate-500">{result.note}</p>}
            </div>
          )}

          {!loading && !result && (
            <p className="text-sm text-slate-500">사건번호와 인용문을 입력하면 검증 결과가 여기에 표시됩니다.</p>
          )}
        </section>
      </div>
    </main>
  );
}
