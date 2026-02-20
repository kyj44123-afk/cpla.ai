import { z } from "zod";

export const AutoPostPromptProfileSchema = z.object({
  objective: z.string().min(1),
  targetAudience: z.string().min(1),
  readerStage: z.string().min(1),
  industryFocus: z.string().min(1),
  riskLevel: z.string().min(1),
  contentDepth: z.string().min(1),
  legalCitationStyle: z.string().min(1),
  tone: z.string().min(1),
  sentenceStyle: z.string().min(1),
  persuasionStyle: z.string().min(1),
  structurePattern: z.string().min(1),
  headlineStyle: z.string().min(1),
  seoStrategy: z.string().min(1),
  keywordDensity: z.string().min(1),
  evidenceType: z.string().min(1),
  ctaType: z.string().min(1),
  tabooPolicy: z.string().min(1),
  complianceMode: z.string().min(1),
  imagePromptStyle: z.string().min(1),
  updateFrequency: z.string().min(1),
});

export type AutoPostPromptProfile = z.infer<typeof AutoPostPromptProfileSchema>;

export const DEFAULT_AUTO_POST_PROMPT_PROFILE: AutoPostPromptProfile = {
  objective: "risk_prevention",
  targetAudience: "ceo_founder",
  readerStage: "problem_awareness",
  industryFocus: "all_industries",
  riskLevel: "high",
  contentDepth: "deep",
  legalCitationStyle: "practical_reference",
  tone: "executive_professional",
  sentenceStyle: "concise_structured",
  persuasionStyle: "evidence_driven",
  structurePattern: "problem_cause_solution_checklist",
  headlineStyle: "benefit_plus_risk",
  seoStrategy: "intent_cluster",
  keywordDensity: "balanced",
  evidenceType: "case_plus_checklist",
  ctaType: "book_consultation",
  tabooPolicy: "strict",
  complianceMode: "conservative",
  imagePromptStyle: "editorial_realistic",
  updateFrequency: "weekly",
};

const PROFILE_LABELS: Record<keyof AutoPostPromptProfile, Record<string, string>> = {
  objective: {
    risk_prevention: "리스크 예방 중심",
    lead_generation: "상담 리드 확보",
    trust_branding: "전문성 브랜딩",
    conversion_focus: "전환율 집중",
  },
  targetAudience: {
    ceo_founder: "대표/창업자",
    hr_manager: "인사담당자",
    team_leader: "팀장/실무리더",
    employee_general: "근로자 일반",
    startup_hr: "스타트업 HR",
    enterprise_hr: "중견/대기업 HR",
  },
  readerStage: {
    problem_awareness: "문제 인식 단계",
    solution_search: "해결책 탐색 단계",
    vendor_compare: "자문사 비교 단계",
    execution_ready: "즉시 실행 단계",
  },
  industryFocus: {
    all_industries: "전 산업 공통",
    it_saas: "IT/SaaS",
    manufacturing: "제조업",
    healthcare: "의료/헬스케어",
    retail_fnb: "유통/F&B",
    logistics: "물류/운송",
    education: "교육/에듀테크",
  },
  riskLevel: {
    low: "저강도 리스크",
    medium: "중강도 리스크",
    high: "고강도 리스크",
    crisis: "분쟁 직전/위기",
  },
  contentDepth: {
    concise: "요약형",
    standard: "표준형",
    deep: "심화형",
    expert: "전문가형",
  },
  legalCitationStyle: {
    none: "법령 인용 최소화",
    practical_reference: "실무형 참고 조항",
    strict_citation: "조문 중심 인용",
    case_first: "판례 우선",
  },
  tone: {
    executive_professional: "임원 보고형",
    calm_expert: "차분한 전문가형",
    assertive: "명확한 단정형",
    coach_like: "코치형 안내",
  },
  sentenceStyle: {
    concise_structured: "짧고 구조화",
    narrative: "서술형",
    briefing: "브리핑형",
    checklist_heavy: "체크리스트 중심",
  },
  persuasionStyle: {
    evidence_driven: "근거 기반 설득",
    loss_aversion: "손실회피 강조",
    benchmark: "벤치마크 비교",
    scenario_based: "시나리오 기반",
  },
  structurePattern: {
    problem_cause_solution_checklist: "문제-원인-해결-체크리스트",
    faq_first: "FAQ 선제시",
    case_first: "사례 선제시",
    framework_3step: "3단계 프레임워크",
    timeline_playbook: "타임라인 플레이북",
  },
  headlineStyle: {
    benefit_plus_risk: "효익+리스크",
    question_type: "질문형",
    number_list: "숫자 리스트형",
    authority_type: "전문가 권위형",
    urgency_type: "긴급성 강조형",
  },
  seoStrategy: {
    intent_cluster: "검색의도 클러스터",
    long_tail: "롱테일 중심",
    local_plus_service: "지역+서비스형",
    issue_breakdown: "쟁점 분해형",
  },
  keywordDensity: {
    light: "낮음",
    balanced: "균형",
    assertive: "강화",
  },
  evidenceType: {
    case_plus_checklist: "사례+체크리스트",
    regulation_plus_template: "법령+템플릿",
    metric_plus_case: "지표+사례",
    qa_plus_example: "Q&A+예시",
  },
  ctaType: {
    book_consultation: "상담 예약",
    risk_diagnosis: "RISK 진단 유도",
    download_checklist: "체크리스트 다운로드",
    call_direct: "전화 문의",
  },
  tabooPolicy: {
    strict: "과장/단정 엄격 금지",
    moderate: "일반 금지",
    soft: "완화",
  },
  complianceMode: {
    conservative: "보수적 준법",
    balanced: "균형형",
    aggressive: "공격적 제안",
  },
  imagePromptStyle: {
    editorial_realistic: "에디토리얼 실사",
    clean_infographic: "클린 인포그래픽",
    corporate_minimal: "코퍼레이트 미니멀",
    cinematic: "시네마틱",
  },
  updateFrequency: {
    daily: "매일",
    triweekly: "주 3회",
    weekly: "주 1회",
    biweekly: "격주",
    monthly: "월 1회",
  },
};

export function normalizeAutoPostPromptProfile(value: unknown): AutoPostPromptProfile {
  const parsed = AutoPostPromptProfileSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return DEFAULT_AUTO_POST_PROMPT_PROFILE;
}

export function describeAutoPostPromptProfile(profile: AutoPostPromptProfile): string[] {
  const entries = Object.entries(profile) as Array<[keyof AutoPostPromptProfile, string]>;
  return entries.map(([key, value]) => {
    const label = PROFILE_LABELS[key][value] ?? value;
    return `${key}: ${label}`;
  });
}
