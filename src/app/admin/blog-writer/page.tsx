"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, CheckCircle2, FileText, ChevronRight, PenTool, Copy } from "lucide-react";
import Image from "next/image";
import { ToneOptions, ToneType } from "@/lib/blog-prompts";

// Types
type Step = "input" | "ideation" | "drafting" | "result";

type IdeationResult = {
  titles: string[];
  outline: { heading: string; description: string }[];
};

type ImagePrompt = {
  section: string;
  prompt: string;
};

type DraftResult = {
  title: string;
  content: string;
  hashtags: string[];
  imagePrompts: ImagePrompt[];
  qualityReport?: {
    score: number;
    improvements: string[];
  };
};

export default function BlogWriterPage() {
  const [step, setStep] = useState<Step>("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePromptCopied, setImagePromptCopied] = useState(false);

  // Step 1 State
  const [keyword, setKeyword] = useState("");
  const [tone, setTone] = useState<ToneType>("polite");
  const [styleSample, setStyleSample] = useState("");

  // Step 2 State (Ideation)
  const [ideation, setIdeation] = useState<IdeationResult | null>(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [outline, setOutline] = useState<{ heading: string; description?: string }[]>([]);

  // Step 3 State (Draft)
  const [draft, setDraft] = useState<DraftResult | null>(null);

  // --- Handlers ---

  const handleIdeation = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/blog-writer/ideation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, preset: "general" }), // Preset은 추후 확장 가능
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "아이디어 생성 실패");
      }

      const data = await res.json();
      setIdeation(data);
      setOutline(data.outline);
      if (data.titles.length > 0) setSelectedTitle(data.titles[0]);
      setStep("ideation");
    } catch (e) {
      const message = e instanceof Error ? e.message : "오류가 발생했습니다. 다시 시도해주세요.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/blog-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          title: selectedTitle,
          outline,
          tone,
          styleSample,
        }),
      });

      if (!res.ok) throw new Error("초안 생성 실패");

      const data = await res.json();

      // Map API response to DraftResult
      setDraft({
        title: data.draft.title,
        content: data.markdown,
        hashtags: data.draft.hashtags || [],
        imagePrompts: data.imagePrompts || [],
        qualityReport: data.qualityReport,
      });

      setStep("result");
    } catch (e) {
      console.error(e);
      setError("글 작성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog-writer/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          content: draft.content,
        }),
      });

      if (!res.ok) throw new Error("발행 실패");

      const { id } = await res.json();
      alert(`성공적으로 발행되었습니다! (ID: ${id})`);
      // Reset or redirect
      window.location.reload();
    } catch (e) {
      alert("발행 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImagePrompts = () => {
    if (!draft?.imagePrompts) return;
    const text = draft.imagePrompts.map(p => `[${p.section}]\n${p.prompt}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setImagePromptCopied(true);
    setTimeout(() => setImagePromptCopied(false), 2000);
  };

  // --- Render Steps ---

  const renderInputStep = () => (
    <div className="max-w-xl mx-auto space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Blog Writer 2.1</h1>
        <p className="text-muted-foreground">키워드를 입력하면, 상위 노출 기획과 고퀄리티 원고를 설계합니다.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label>메인 키워드</Label>
            <Input
              placeholder="예: 부당해고 구제신청, 주휴수당 계산법"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="text-lg py-6"
            />
          </div>

          <div className="space-y-2">
            <Label>글의 톤앤매너</Label>
            <div className="grid grid-cols-2 gap-3">
              {ToneOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setTone(opt.value)}
                  className={`
                    cursor-pointer border rounded-lg p-4 text-center transition-all
                    ${tone === opt.value ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:bg-accent"}
                  `}
                >
                  <div className="font-semibold">{opt.label.split(" ")[0]}</div>
                  <div className="text-xs text-muted-foreground mt-1">{opt.label.split(" ")[1]}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>내 글 샘플 (선택)</Label>
            <textarea
              value={styleSample}
              onChange={(e) => setStyleSample(e.target.value)}
              placeholder="내가 직접 쓴 문단을 붙여넣으면 문체와 전문성 신호를 추출해 반영합니다."
              className="w-full min-h-[140px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <Button
            size="lg"
            className="w-full text-lg h-12"
            onClick={handleIdeation}
            disabled={!keyword.trim() || loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <PenTool className="w-5 h-5 mr-2" />
            )}
            기획안 만들기 (D.I.A)
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderIdeationStep = () => (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">기획안 검토 & 수정</h2>
        <Button variant="outline" onClick={() => setStep("input")}>처음으로</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Title Selection */}
        <div className="md:col-span-1 space-y-4">
          <Label className="text-lg">제목 선택</Label>
          <div className="space-y-3">
            {ideation?.titles.map((t, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedTitle(t)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all text-sm font-medium leading-relaxed
                  ${selectedTitle === t ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:bg-accent"}
                `}
              >
                {t}
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Label className="text-sm text-muted-foreground mb-2 block">직접 입력</Label>
            <Input
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              placeholder="제목을 직접 수정할 수 있습니다."
            />
          </div>
        </div>

        {/* Outline Editor */}
        <div className="md:col-span-2 space-y-4">
          <Label className="text-lg">목차 구성 (D.I.A 로직)</Label>
          <div className="bg-muted/30 rounded-xl p-4 space-y-3 border">
            {outline.map((item, idx) => (
              <div key={idx} className="bg-background rounded-lg p-4 border shadow-sm group">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {idx + 1}
                  </span>
                  <Input
                    value={item.heading}
                    onChange={(e) => {
                      const newOutline = [...outline];
                      newOutline[idx].heading = e.target.value;
                      setOutline(newOutline);
                    }}
                    className="font-semibold border-none shadow-none h-auto p-0 focus-visible:ring-0"
                  />
                </div>
                <Input
                  value={item.description || ""}
                  onChange={(e) => {
                    const newOutline = [...outline];
                    newOutline[idx].description = e.target.value;
                    setOutline(newOutline);
                  }}
                  className="text-sm text-muted-foreground border-none shadow-none h-auto p-0 focus-visible:ring-0 pl-9"
                  placeholder="내용 가이드 입력..."
                />
              </div>
            ))}
            <Button
              variant="ghost"
              className="w-full border-dashed border-2 py-6 text-muted-foreground"
              onClick={() => setOutline([...outline, { heading: "새로운 챕터", description: "" }])}
            >
              + 챕터 추가하기
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button size="lg" className="w-full md:w-auto px-8" onClick={handleGenerateDraft} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
          블로그 초안 생성하기
        </Button>
      </div>
    </div>
  );

  const renderResultStep = () => (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">생성 완료</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => setStep("ideation")}>기획안 다시 수정</Button>
          <Button variant="default" onClick={handlePublish} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "블로그 발행하기"}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Preview */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border shadow-sm rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b p-6">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-4">{draft?.title}</h1>
              <div className="flex flex-wrap gap-2">
                {draft?.hashtags.map((tag) => (
                  <span key={tag} className="text-blue-500 text-sm font-medium">{tag}</span>
                ))}
              </div>
              {draft?.qualityReport && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-sm font-semibold text-emerald-900">품질 점수: {draft.qualityReport.score}/100</p>
                  {draft.qualityReport.improvements?.length > 0 && (
                    <p className="mt-1 text-xs text-emerald-800">{draft.qualityReport.improvements.join(" / ")}</p>
                  )}
                </div>
              )}
            </div>
            <div className="p-8 prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-xl prose-p:text-slate-600 prose-p:leading-relaxed">
              {draft?.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <h2 key={i} className="mt-8 mb-4">{line.replace("## ", "")}</h2>;
                if (line.startsWith("### ")) return <h3 key={i} className="mt-6 mb-3">{line.replace("### ", "")}</h3>;
                if (line.startsWith("- ")) return <li key={i} className="ml-4">{line.replace("- ", "")}</li>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>
        </div>

        {/* Action Sidebar & Image Prompts */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <Label className="mb-2 block">HTML 복사</Label>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(draft?.content || "");
                  alert("마크다운이 복사되었습니다.");
                }}
              >
                본문 복사하기
              </Button>
            </CardContent>
          </Card>

          {/* Image Prompts Section */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-amber-900 font-bold flex items-center gap-2">
                  <PenTool className="w-4 h-4" /> AI 이미지 프롬프트
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
                  onClick={handleCopyImagePrompts}
                >
                  {imagePromptCopied ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {imagePromptCopied ? "복사됨" : "전체 복사"}
                </Button>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {draft?.imagePrompts?.map((item, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-md border border-amber-100 text-xs shadow-sm">
                    <div className="font-bold text-amber-800 mb-1">{item.section}</div>
                    <p className="text-slate-600 leading-relaxed font-mono">{item.prompt}</p>
                  </div>
                ))}
                {!draft?.imagePrompts?.length && (
                  <p className="text-sm text-amber-800">이미지 프롬프트가 생성되지 않았습니다.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 text-center text-sm font-medium">
          {error}
        </div>
      )}

      {step === "input" && renderInputStep()}
      {step === "ideation" && renderIdeationStep()}
      {step === "result" && renderResultStep()}
    </div>
  );
}
