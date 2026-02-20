"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AutoPostPromptProfile,
  DEFAULT_AUTO_POST_PROMPT_PROFILE,
  describeAutoPostPromptProfile,
} from "@/lib/autoPostPromptProfile";

type Option = { value: string; label: string };

const OPTION_MAP: Record<keyof AutoPostPromptProfile, Option[]> = {
  objective: [
    { value: "risk_prevention", label: "리스크 예방 중심" },
    { value: "lead_generation", label: "상담 리드 확보" },
    { value: "trust_branding", label: "전문성 브랜딩" },
    { value: "conversion_focus", label: "전환율 집중" },
  ],
  targetAudience: [
    { value: "ceo_founder", label: "대표/창업자" },
    { value: "hr_manager", label: "인사담당자" },
    { value: "team_leader", label: "팀장/실무리더" },
    { value: "employee_general", label: "근로자 일반" },
    { value: "startup_hr", label: "스타트업 HR" },
    { value: "enterprise_hr", label: "중견/대기업 HR" },
  ],
  readerStage: [
    { value: "problem_awareness", label: "문제 인식 단계" },
    { value: "solution_search", label: "해결책 탐색 단계" },
    { value: "vendor_compare", label: "자문사 비교 단계" },
    { value: "execution_ready", label: "즉시 실행 단계" },
  ],
  industryFocus: [
    { value: "all_industries", label: "전 산업 공통" },
    { value: "it_saas", label: "IT/SaaS" },
    { value: "manufacturing", label: "제조업" },
    { value: "healthcare", label: "의료/헬스케어" },
    { value: "retail_fnb", label: "유통/F&B" },
    { value: "logistics", label: "물류/운송" },
    { value: "education", label: "교육/에듀테크" },
  ],
  riskLevel: [
    { value: "low", label: "저강도 리스크" },
    { value: "medium", label: "중강도 리스크" },
    { value: "high", label: "고강도 리스크" },
    { value: "crisis", label: "분쟁 직전/위기" },
  ],
  contentDepth: [
    { value: "concise", label: "요약형" },
    { value: "standard", label: "표준형" },
    { value: "deep", label: "심화형" },
    { value: "expert", label: "전문가형" },
  ],
  legalCitationStyle: [
    { value: "none", label: "법령 인용 최소화" },
    { value: "practical_reference", label: "실무형 참고 조항" },
    { value: "strict_citation", label: "조문 중심 인용" },
    { value: "case_first", label: "판례 우선" },
  ],
  tone: [
    { value: "executive_professional", label: "임원 보고형" },
    { value: "calm_expert", label: "차분한 전문가형" },
    { value: "assertive", label: "명확한 단정형" },
    { value: "coach_like", label: "코치형 안내" },
  ],
  sentenceStyle: [
    { value: "concise_structured", label: "짧고 구조화" },
    { value: "narrative", label: "서술형" },
    { value: "briefing", label: "브리핑형" },
    { value: "checklist_heavy", label: "체크리스트 중심" },
  ],
  persuasionStyle: [
    { value: "evidence_driven", label: "근거 기반 설득" },
    { value: "loss_aversion", label: "손실회피 강조" },
    { value: "benchmark", label: "벤치마크 비교" },
    { value: "scenario_based", label: "시나리오 기반" },
  ],
  structurePattern: [
    { value: "problem_cause_solution_checklist", label: "문제-원인-해결-체크리스트" },
    { value: "faq_first", label: "FAQ 선제시" },
    { value: "case_first", label: "사례 선제시" },
    { value: "framework_3step", label: "3단계 프레임워크" },
    { value: "timeline_playbook", label: "타임라인 플레이북" },
  ],
  headlineStyle: [
    { value: "benefit_plus_risk", label: "효익+리스크" },
    { value: "question_type", label: "질문형" },
    { value: "number_list", label: "숫자 리스트형" },
    { value: "authority_type", label: "전문가 권위형" },
    { value: "urgency_type", label: "긴급성 강조형" },
  ],
  seoStrategy: [
    { value: "intent_cluster", label: "검색의도 클러스터" },
    { value: "long_tail", label: "롱테일 중심" },
    { value: "local_plus_service", label: "지역+서비스형" },
    { value: "issue_breakdown", label: "쟁점 분해형" },
  ],
  keywordDensity: [
    { value: "light", label: "낮음" },
    { value: "balanced", label: "균형" },
    { value: "assertive", label: "강화" },
  ],
  evidenceType: [
    { value: "case_plus_checklist", label: "사례+체크리스트" },
    { value: "regulation_plus_template", label: "법령+템플릿" },
    { value: "metric_plus_case", label: "지표+사례" },
    { value: "qa_plus_example", label: "Q&A+예시" },
  ],
  ctaType: [
    { value: "book_consultation", label: "상담 예약" },
    { value: "risk_diagnosis", label: "RISK 진단 유도" },
    { value: "download_checklist", label: "체크리스트 다운로드" },
    { value: "call_direct", label: "전화 문의" },
  ],
  tabooPolicy: [
    { value: "strict", label: "과장/단정 엄격 금지" },
    { value: "moderate", label: "일반 금지" },
    { value: "soft", label: "완화" },
  ],
  complianceMode: [
    { value: "conservative", label: "보수적 준법" },
    { value: "balanced", label: "균형형" },
    { value: "aggressive", label: "공격적 제안" },
  ],
  imagePromptStyle: [
    { value: "editorial_realistic", label: "에디토리얼 실사" },
    { value: "clean_infographic", label: "클린 인포그래픽" },
    { value: "corporate_minimal", label: "코퍼레이트 미니멀" },
    { value: "cinematic", label: "시네마틱" },
  ],
  updateFrequency: [
    { value: "daily", label: "매일" },
    { value: "triweekly", label: "주 3회" },
    { value: "weekly", label: "주 1회" },
    { value: "biweekly", label: "격주" },
    { value: "monthly", label: "월 1회" },
  ],
};

const LABEL_MAP: Record<keyof AutoPostPromptProfile, string> = {
  objective: "목표",
  targetAudience: "독자 페르소나",
  readerStage: "독자 단계",
  industryFocus: "산업군",
  riskLevel: "리스크 강도",
  contentDepth: "콘텐츠 깊이",
  legalCitationStyle: "법률 인용 스타일",
  tone: "문체 톤",
  sentenceStyle: "문장 스타일",
  persuasionStyle: "설득 방식",
  structurePattern: "문서 구조 패턴",
  headlineStyle: "헤드라인 전략",
  seoStrategy: "SEO 전략",
  keywordDensity: "키워드 밀도",
  evidenceType: "근거 제시 방식",
  ctaType: "CTA 방식",
  tabooPolicy: "금지 표현 정책",
  complianceMode: "준법 성향",
  imagePromptStyle: "이미지 프롬프트 스타일",
  updateFrequency: "발행 주기",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<AutoPostPromptProfile>(DEFAULT_AUTO_POST_PROMPT_PROFILE);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "설정을 불러오지 못했습니다.");
        setProfile(data.autoPostPromptProfile ?? DEFAULT_AUTO_POST_PROMPT_PROFILE);
        setUpdatedAt(data.updatedAt ?? null);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "설정 로드 중 오류가 발생했습니다.";
        setMessage(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const summaryLines = useMemo(() => describeAutoPostPromptProfile(profile), [profile]);

  const updateField = (key: keyof AutoPostPromptProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setMessage("");
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPostPromptProfile: profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장에 실패했습니다.");
      setUpdatedAt(data.updatedAt ?? null);
      setMessage("자동발행 프롬프트 설정을 저장했습니다.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
      setMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    setProfile(DEFAULT_AUTO_POST_PROMPT_PROFILE);
    setMessage("기본 프롬프트 설정으로 되돌렸습니다. 저장을 눌러 반영하세요.");
  };

  if (loading) {
    return <div className="text-slate-600">설정 불러오는 중...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">자동발행 프롬프트 설정</h1>
        <p className="mt-2 text-sm text-slate-600">
          AI 자동발행 글의 스타일과 전략을 전문가 수준으로 세밀하게 제어합니다.
        </p>
        {updatedAt ? <p className="mt-1 text-xs text-slate-500">마지막 저장: {new Date(updatedAt).toLocaleString("ko-KR")}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {(Object.keys(profile) as Array<keyof AutoPostPromptProfile>).map((key) => (
          <label key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">{LABEL_MAP[key]}</p>
            <select
              value={profile[key]}
              onChange={(event) => updateField(key, event.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
            >
              {OPTION_MAP[key].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500">옵션 수: {OPTION_MAP[key].length}</p>
          </label>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">현재 프롬프트 요약</h2>
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 md:grid-cols-2">
          {summaryLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "저장 중..." : "설정 저장"}
        </button>
        <button
          type="button"
          onClick={resetDefaults}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
        >
          기본값 복원
        </button>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>
    </div>
  );
}
