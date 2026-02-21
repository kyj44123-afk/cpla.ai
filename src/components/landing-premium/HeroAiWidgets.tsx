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
      if (!res.ok) throw new Error(data.error || "Failed to search precedents.");
      setCases(data.cases || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">Precedent Explorer</h3>
      <p className="mt-2 text-sm text-slate-600">Enter a keyword to get 3 related case numbers with short summaries.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="ex) unfair dismissal"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !keyword.trim()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Searching" : "Search"}
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
      if (!res.ok) throw new Error(data.error || "Diagnosis failed.");
      setMissing(data.missing || []);
      setNote(data.note || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">Contract Quick Check</h3>
      <p className="mt-2 text-sm text-slate-600">Upload a PDF and get likely missing clause keywords.</p>
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
          {loading ? "Analyzing" : "Run"}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

      {missing.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-900">Possible missing items</p>
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
      <h3 className="mt-2 text-xl font-semibold text-slate-900">Enterprise Diagnosis Link</h3>
      <p className="mt-2 text-sm text-slate-600">
        Check the enterprise risk diagnosis first, then move to consulting planning.
      </p>
      <Link
        href="/enterprise-diagnosis"
        className="mt-5 inline-flex rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Go to /enterprise-diagnosis
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
      if (!res.ok) throw new Error(data.error || "Structuring failed.");
      setStructured(data.structured || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const rows = structured
    ? [
        { label: "Who", value: structured.who },
        { label: "When", value: structured.when },
        { label: "Where", value: structured.where },
        { label: "What", value: structured.what_action },
        { label: "How", value: structured.how },
        { label: "Context", value: structured.context },
      ]
    : [];

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">Fact Structurer</h3>
      <p className="mt-2 text-sm text-slate-600">Describe the situation and get a 6W-style structured view.</p>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe the incident in detail"
        className="mt-4 h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="button"
        onClick={run}
        disabled={loading || !input.trim()}
        className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Structuring" : "Structure"}
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
      if (!res.ok) throw new Error(data.error || "Quiz generation failed.");
      setCards(data.cards || []);
      setIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const current = cards[index];

  return (
    <aside className={panelClass}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">LLM Tool</p>
      <h3 className="mt-2 text-xl font-semibold text-slate-900">Quiz Quiz</h3>
      <p className="mt-2 text-sm text-slate-600">Type an industry and get 3 custom labor-law quiz cards.</p>
      <div className="mt-4 flex gap-2">
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="ex) manufacturing, IT"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={run}
          disabled={loading || !industry.trim()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Generating" : "Generate"}
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
            {showAnswer ? "Hide answer" : "Show answer"}
          </button>
          {showAnswer ? (
            <p className="mt-2 text-xs leading-relaxed text-slate-700">
              Answer: {current.answerIndex + 1}
              <br />
              {current.explanation}
            </p>
          ) : null}
        </article>
      ) : null}
    </aside>
  );
}
