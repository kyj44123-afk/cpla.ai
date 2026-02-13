"use client";

import React, { useState } from "react";
import { Loader2, Copy, Sparkles, Send } from "lucide-react";
import Link from "next/link";

type BlogSection = {
  heading: string;
  lead: string;
  bullets: string[];
  body: string;
};

type BlogDraft = {
  title: string;
  introHook: string;
  introBody: string;
  summaryBox: string[];
  image: {
    query: string;
    alt: string;
    caption: string;
  };
  sections: BlogSection[];
  caseStudy: {
    title: string;
    situation: string;
    solution: string;
    result: string;
  };
  checklist: string[];
  faq: { question: string; answer: string }[];
  conclusion: string;
  cta: string;
  hashtags: string[];
};

type ApiResponse = {
  draft: BlogDraft;
  imageUrl: string;
  markdown: string;
};

type PresetKey =
  | "labor_firm_hoyeon"
  | "rep_labor_attorney"
  | "directions"
  | "cpla_ai"
  | "labor_legal_advisory"
  | "ai_asks_labor_answers"
  | "advisory_cases"
  | "hr_er_consulting"
  | "hr_system_design"
  | "hr_risk_management"
  | "er_labor_relations"
  | "er_collective_bargaining"
  | "workplace_innovation_consulting"
  | "harassment_sexual"
  | "incident_investigation"
  | "report_related_advisory"
  | "corporate_training"
  | "subsidy_application_support";

const PRESET_OPTIONS: { value: PresetKey; label: string; defaultTone: string }[] = [
  {
    value: "labor_firm_hoyeon",
    label: "노무법인 호연",
    defaultTone: "법인 소개형, 신뢰 중심 톤",
  },
  {
    value: "rep_labor_attorney",
    label: "└ 대표노무사 곽영준",
    defaultTone: "노무사 칼럼형, 법적 리스크를 쉽게 설명하는 신뢰형 톤",
  },
  {
    value: "directions",
    label: "└ 오시는 길",
    defaultTone: "방문 안내형, 간결하고 친절한 톤",
  },
  {
    value: "cpla_ai",
    label: "CPLA + AI",
    defaultTone: "노무+AI 융합 인사이트형, 실무 자동화 중심 톤",
  },
  {
    value: "labor_legal_advisory",
    label: "노동법률 자문",
    defaultTone: "법률 자문형, 쟁점 정리 중심 톤",
  },
  {
    value: "ai_asks_labor_answers",
    label: "└ AI가 묻고 노무사가 답하다",
    defaultTone: "Q&A형, 쉬운 설명 중심 톤",
  },
  {
    value: "advisory_cases",
    label: "└ 자문 사례",
    defaultTone: "사례 분석형, 문제-해결 구조 톤",
  },
  {
    value: "hr_er_consulting",
    label: "HR·ER 컨설팅",
    defaultTone: "컨설팅 리포트형, 실행안 중심 톤",
  },
  {
    value: "hr_system_design",
    label: "└ HR 제도설계",
    defaultTone: "제도설계형, 체계적 설명 톤",
  },
  {
    value: "hr_risk_management",
    label: "└ HR 리스크관리",
    defaultTone: "리스크 매뉴얼형, 예방 중심 톤",
  },
  {
    value: "er_labor_relations",
    label: "└ ER 노사관계",
    defaultTone: "노사관계 실무형, 균형 잡힌 톤",
  },
  {
    value: "er_collective_bargaining",
    label: "└ ER 단체교섭",
    defaultTone: "단체교섭 전략형, 절차·논리 중심 톤",
  },
  {
    value: "workplace_innovation_consulting",
    label: "└ 일터혁신컨설팅",
    defaultTone: "혁신 실행형, 변화관리 중심 톤",
  },
  {
    value: "harassment_sexual",
    label: "직장 내 괴롭힘·성희롱",
    defaultTone: "민감이슈 대응형, 보호·절차 중심 톤",
  },
  {
    value: "incident_investigation",
    label: "└ 사건조사 및 심의",
    defaultTone: "사건조사 매뉴얼형, 절차와 증빙 중심의 명확한 톤",
  },
  {
    value: "report_related_advisory",
    label: "└ 신고 관련 자문",
    defaultTone: "신고 프로세스 안내형, 중립·보호 중심 톤",
  },
  {
    value: "corporate_training",
    label: "기업교육",
    defaultTone: "교육기획형, 실무 적용 중심 톤",
  },
  {
    value: "subsidy_application_support",
    label: "지원금 신청 대행",
    defaultTone: "지원사업 안내형, 요건·절차 중심 톤",
  },
];

export default function AdminBlogWriterPage() {
  const [keyword, setKeyword] = useState("");
  const [preset, setPreset] = useState<PresetKey>("rep_labor_attorney");
  const [tone, setTone] = useState("노무사 칼럼형, 법적 리스크를 쉽게 설명하는 신뢰형 톤");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handlePresetChange = (nextPreset: PresetKey) => {
    setPreset(nextPreset);
    const option = PRESET_OPTIONS.find((item) => item.value === nextPreset);
    setTone(option?.defaultTone ?? "");
  };

  const handleGenerate = async () => {
    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      setError("키워드를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setPublishError("");
    setPublishedPostId(null);
    setCopied(false);

    try {
      const res = await fetch("/api/admin/blog-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: trimmedKeyword,
          preset,
          tone,
          length,
        }),
      });

      const data = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "생성 실패");
      }
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("블로그 초안 생성에 실패했습니다.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.markdown) return;
    await navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePublish = async () => {
    if (!result) return;

    setPublishing(true);
    setPublishError("");

    try {
      const res = await fetch("/api/admin/blog-writer/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.draft.title,
          content: result.markdown,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        throw new Error(data.error || "발행 실패");
      }

      setPublishedPostId(data.id);
    } catch (e) {
      console.error(e);
      setPublishError("posts 테이블 저장에 실패했습니다.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">블로그 글 자동작성</h1>
        <p className="mt-2 text-slate-500">`snu_cpla` 카테고리별 프리셋으로 자동 생성합니다.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {PRESET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 근로계약서 작성 방법"
            className="md:col-span-2 w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />

          <select
            value={length}
            onChange={(e) => setLength(e.target.value as "short" | "medium" | "long")}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="short">짧게</option>
            <option value="medium">보통</option>
            <option value="long">길게</option>
          </select>
        </div>

        <input
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="톤 예: 원장님 칼럼형, 실무 친화형"
          className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "생성 중..." : "자동 생성"}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">{result.draft.title}</h2>
            <p className="text-slate-800 leading-7">{result.draft.introHook}</p>
            <p className="text-slate-700 leading-7">{result.draft.introBody}</p>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">한눈에 핵심 요약</p>
              <ul className="space-y-1 text-sm text-blue-800 list-disc pl-5">
                {result.draft.summaryBox.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.imageUrl} alt={result.draft.image.alt} className="w-full h-auto object-cover" />
            </div>
            <p className="text-sm text-slate-500">{result.draft.image.caption}</p>

            {result.draft.sections.map((section, idx) => (
              <section key={`${section.heading}-${idx}`} className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">{section.heading}</h3>
                <p className="text-slate-700 leading-7 whitespace-pre-wrap">{section.lead}</p>
                {section.bullets.length > 0 && (
                  <ul className="list-disc pl-5 text-slate-700">
                    {section.bullets.map((bullet, bulletIdx) => (
                      <li key={`${bullet}-${bulletIdx}`}>{bullet}</li>
                    ))}
                  </ul>
                )}
                <p className="text-slate-700 leading-7 whitespace-pre-wrap">{section.body}</p>
              </section>
            ))}

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">사례로 보는 적용 포인트</h3>
              <p className="font-medium text-slate-800">{result.draft.caseStudy.title}</p>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                <li>상황: {result.draft.caseStudy.situation}</li>
                <li>대응: {result.draft.caseStudy.solution}</li>
                <li>결과: {result.draft.caseStudy.result}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">실무 체크리스트</h3>
              <ul className="list-disc pl-5 text-slate-700 space-y-1">
                {result.draft.checklist.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">자주 묻는 질문</h3>
              <div className="space-y-3">
                {result.draft.faq.map((item, idx) => (
                  <div key={`${item.question}-${idx}`} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-slate-800">Q. {item.question}</p>
                    <p className="text-slate-700 mt-1">A. {item.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">마무리</h3>
              <p className="text-slate-700 leading-7 whitespace-pre-wrap">{result.draft.conclusion}</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">상담/문의 안내</h3>
              <p className="text-slate-700 leading-7 whitespace-pre-wrap">{result.draft.cta}</p>
            </section>

            <p className="text-sm text-slate-500">{result.draft.hashtags.join(" ")}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Markdown 결과</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "복사됨" : "복사"}
                </button>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {publishing ? "발행 중..." : "posts로 발행"}
                </button>
              </div>
            </div>
            {publishError && <p className="text-sm text-red-600">{publishError}</p>}
            {publishedPostId && (
              <p className="text-sm text-green-600">
                발행 완료: post id `{publishedPostId}` (
                <Link href={`/project/${publishedPostId}`} className="underline">
                  프로젝트 페이지 보기
                </Link>
                )
              </p>
            )}
            <textarea
              readOnly
              value={result.markdown}
              className="w-full h-96 border border-slate-300 rounded-lg p-3 font-mono text-sm text-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
