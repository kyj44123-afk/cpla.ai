"use client";

import React, { useState } from "react";
import { Loader2, Copy, Sparkles, Send } from "lucide-react";
import Link from "next/link";

type BlogSection = {
  heading: string;
  content: string;
};

type BlogDraft = {
  title: string;
  intro: string;
  image: {
    query: string;
    alt: string;
    caption: string;
  };
  sections: BlogSection[];
  conclusion: string;
  hashtags: string[];
};

type ApiResponse = {
  draft: BlogDraft;
  imageUrl: string;
  markdown: string;
};

export default function AdminBlogWriterPage() {
  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState("전문적이지만 친절한 설명형");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishedPostId, setPublishedPostId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

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
    if (!result?.markdown) {
      return;
    }
    await navigator.clipboard.writeText(result.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePublish = async () => {
    if (!result) {
      return;
    }

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
        <p className="mt-2 text-slate-500">키워드를 넣으면 인트로, 삽입 이미지, 본문까지 한 번에 생성합니다.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          placeholder="톤 예: 실무 중심, 친근한 설명형"
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
            <p className="text-slate-700 leading-7">{result.draft.intro}</p>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.imageUrl} alt={result.draft.image.alt} className="w-full h-auto object-cover" />
            </div>
            <p className="text-sm text-slate-500">{result.draft.image.caption}</p>

            {result.draft.sections.map((section, idx) => (
              <section key={`${section.heading}-${idx}`} className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-800">{section.heading}</h3>
                <p className="text-slate-700 leading-7 whitespace-pre-wrap">{section.content}</p>
              </section>
            ))}

            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800">마무리</h3>
              <p className="text-slate-700 leading-7 whitespace-pre-wrap">{result.draft.conclusion}</p>
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
              className="w-full h-80 border border-slate-300 rounded-lg p-3 font-mono text-sm text-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}
