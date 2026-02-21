"use client";

import Link from "next/link";
import { useState } from "react";

type QuizCard = {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
};

type FactShape = {
  who: string;
  when: string;
  where: string;
  what_action: string;
  how: string;
  context: string;
};

const panelClass =
  "rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.7)] md:p-6";

export function PrecedentExplorerWidget() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState<{ caseNumber: string; summary: string }[]>([]);

  const run = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/hero-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "precedent-search", keyword }),
      });
      const data = (await res.json()) as { cases?: { caseNumber: string; summary: string }[]; error?: string };
      if (!res.ok) throw new Error(data.error || "판례 탐색에 실패했습니다.");
      setCases(data.cases || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">판례탐색기</h3>
      <p className="mt-2 text-sm text-slate-600">키워드를 입력하면 관련 판례 3건의 판결번호와 요약을 보여줍니다.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 부당해고, 임금체불"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !keyword.trim()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "검색중" : "탐색"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      <div className="mt-4 space-y-3">
        {cases.map((item) => (
          <article key={`${item.caseNumber}-${item.summary}`} className="rounded-2xl bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{item.caseNumber}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.summary}</p>
          </article>
        ))}
      </div>
    </aside>
  );
}

export function ContractDiagnosisWidget() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const run = async () => {
    if (!file) return;
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("tool", "contract-diagnosis");
      form.append("file", file);

      const res = await fetch("/api/hero-tools", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { missing?: string[]; note?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "진단에 실패했습니다.");
      setMissing(data.missing || []);
      setNote(data.note || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">근로계약서 간단진단</h3>
      <p className="mt-2 text-sm text-slate-600">PDF를 업로드하면 누락 가능 조항 키워드를 찾아드립니다.</p>
      <div className="mt-4 space-y-2">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !file}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "분석중" : "진단하기"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {missing.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">누락 가능 항목</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missing.map((item) => (
              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {item}
              </span>
            ))}
          </div>
          {note ? <p className="mt-3 text-xs text-slate-600">{note}</p> : null}
        </div>
      ) : null}
    </aside>
  );
}

export function ConsultingLinkWidget() {
  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">기업 진단 연결</h3>
      <p className="mt-2 text-sm text-slate-600">컨설팅 전에 기업 리스크 진단을 먼저 진행해 우선 과제를 확인하세요.</p>
      <Link
        href="/enterprise-diagnosis"
        className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        /enterprise-diagnosis 이동
      </Link>
    </aside>
  );
}

export function FactStructurerWidget() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [structured, setStructured] = useState<FactShape | null>(null);

  const run = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/hero-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "fact-structure", input }),
      });
      const data = (await res.json()) as { structured?: FactShape; error?: string };
      if (!res.ok) throw new Error(data.error || "구조화에 실패했습니다.");
      setStructured(data.structured || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const rows = structured
    ? [
        { label: "누가", value: structured.who },
        { label: "언제", value: structured.when },
        { label: "어디서", value: structured.where },
        { label: "어떤 행동", value: structured.what_action },
        { label: "어떤 방식", value: structured.how },
        { label: "어떤 맥락", value: structured.context },
      ]
    : [];

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">사실관계 구조화</h3>
      <p className="mt-2 text-sm text-slate-600">상황을 입력하면 육하원칙 기준으로 구조화해 보여줍니다.</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="사건 상황을 상세히 입력해주세요"
        className="mt-4 h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={run}
        disabled={loading || !input.trim()}
        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "정리중" : "구조화하기"}
      </button>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">{row.label}</p>
              <p className="mt-1 text-sm text-slate-800">{row.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

export function QuizCarouselWidget() {
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<QuizCard[]>([]);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const run = async () => {
    setError("");
    setLoading(true);
    setShowAnswer(false);
    try {
      const res = await fetch("/api/hero-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "quiz-generator", industry }),
      });
      const data = (await res.json()) as { cards?: QuizCard[]; error?: string };
      if (!res.ok) throw new Error(data.error || "퀴즈 생성에 실패했습니다.");
      setCards(data.cards || []);
      setIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const current = cards[index];

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">퀴즈퀴즈</h3>
      <p className="mt-2 text-sm text-slate-600">업종을 입력하면 맞춤형 노동법 퀴즈 카드 3개를 생성합니다.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="예: 제조업, IT"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !industry.trim()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "생성중" : "생성"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {current ? (
        <article className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              CARD {index + 1} / {cards.length}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIndex((prev) => Math.max(prev - 1, 0));
                  setShowAnswer(false);
                }}
                disabled={index === 0}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIndex((prev) => Math.min(prev + 1, cards.length - 1));
                  setShowAnswer(false);
                }}
                disabled={index === cards.length - 1}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-40"
              >
                {">"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{current.question}</p>
          <ul className="mt-2 space-y-1">
            {current.choices.map((choice, idx) => (
              <li key={`${choice}-${idx}`} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
                {idx + 1}. {choice}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowAnswer((prev) => !prev)}
            className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            {showAnswer ? "정답 숨기기" : "정답/해설 보기"}
          </button>
          {showAnswer ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              정답: {current.answerIndex + 1}번
              <br />
              {current.explanation}
            </p>
          ) : null}
        </article>
      ) : null}
    </aside>
  );
}
