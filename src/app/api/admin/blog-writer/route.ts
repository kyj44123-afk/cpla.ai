import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { withSecurity, validateBody } from "@/lib/api-security";
import { z } from "zod";

// ... (Types kept same) ...
type BlogImage = {
  query: string;
  alt: string;
  caption: string;
};

type BlogSection = {
  heading: string;
  lead: string;
  bullets: string[];
  body: string;
};

type BlogCaseStudy = {
  title: string;
  situation: string;
  solution: string;
  result: string;
};

type BlogFaq = {
  question: string;
  answer: string;
};

type SectionImagePrompt = {
  section: string;
  prompt: string;
};

type BlogDraft = {
  title: string;
  introHook: string;
  introBody: string;
  summaryBox: string[];
  image: BlogImage;
  sections: BlogSection[];
  caseStudy: BlogCaseStudy;
  checklist: string[];
  faq: BlogFaq[];
  conclusion: string;
  cta: string;
  hashtags: string[];
};

// Remove RequestBody type, use Zod inference or just manual
// Zod Schema
const BlogWriterSchema = z.object({
  keyword: z.string().min(1, "키워드를 입력해주세요."),
  tone: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).optional(),
  preset: z.string().optional(),
  styleSample: z.string().optional(),
  styleBlueprint: z
    .object({
      voiceRules: z.array(z.string()).optional(),
      expertiseSignals: z.array(z.string()).optional(),
      forbiddenPatterns: z.array(z.string()).optional(),
      naverExposurePlaybook: z.array(z.string()).optional(),
      qualityChecklist: z.array(z.string()).optional(),
    })
    .optional(),
});

type RequestBody = z.infer<typeof BlogWriterSchema>;

type PresetKey =
  | "labor_firm_hoyeon"
  | "rep_labor_attorney"
  | "directions"
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

// ... (PresetConfig and createPreset kept same) ...
type PresetConfig = {
  label: string;
  defaultTone: string;
  targetAudience: string;
  systemRoleLines: string[];
  userRules: string[];
  playbook: string[];
  titleSuffix: string;
  caseStudySuffix: string;
};

type QualityReport = {
  score: number;
  improvements: string[];
};

type StyleBlueprint = {
  voiceRules: string[];
  expertiseSignals: string[];
  forbiddenPatterns: string[];
  naverExposurePlaybook: string[];
  qualityChecklist: string[];
};

function createPreset(config: {
  label: string;
  defaultTone: string;
  titleSuffix: string;
  caseStudySuffix: string;
  targetAudience?: string;
  systemRoleLines?: string[];
  userRules?: string[];
  playbook?: string[];
}): PresetConfig {
  return {
    label: config.label,
    defaultTone: config.defaultTone,
    targetAudience: config.targetAudience ?? "대한민국 사업주, 인사담당자, 근로자(노동 이슈 해결 목적)",
    systemRoleLines: config.systemRoleLines ?? [
      "당신은 대한민국 노무 블로그 콘텐츠를 제작하는 네이버 블로그 에디터다.",
      "노동법/인사노무 이슈를 정확하고 쉽게 설명해 신뢰를 만드는 글을 작성한다.",
      "1) 검색엔진용 키워드 나열 금지, 독자 문제 해결 중심",
      "2) 법적 단정 표현을 피하고 적용 조건과 예외를 함께 제시",
      "3) 현장 실무에서 바로 쓸 수 있게 절차와 체크리스트 포함",
      "4) 모바일 가독성을 위해 2~3문장 단락 중심",
      "반드시 JSON만 출력한다.",
    ],
    userRules: config.userRules ?? [
      "- sections: 핵심원칙 + 현장적용 + 실수방지 포인트 구조",
      "- caseStudy: 실제 상담실에서 다룰 법한 가상 사례 1개",
      "- checklist: 실무 점검 항목 5~7개(문서/절차/증빙 포함)",
      "- faq: 자주 묻는 질문 2~4개",
      "- cta: 과장 없이 진단/상담 유도",
    ],
    playbook: config.playbook ?? [
      "독자가 바로 실행할 수 있는 문장으로 작성",
      "단정적 표현보다 조건/예외를 함께 제시",
      "현장 사례 기반 문장 1개 이상 포함",
    ],
    titleSuffix: config.titleSuffix,
    caseStudySuffix: config.caseStudySuffix,
  };
}

const PRESET_CONFIG: Record<PresetKey, PresetConfig> = {
  labor_firm_hoyeon: createPreset({
    label: "노무법인 호연",
    defaultTone: "법인 소개형, 신뢰 중심 톤",
    titleSuffix: "노무법인 서비스 안내",
    caseStudySuffix: "노무법인 수행 사례",
    playbook: [
      "법인 강점은 2~3개만 구체적으로 제시",
      "서비스 선택 기준을 독자 관점 체크리스트로 제공",
      "신뢰 형성을 위해 절차와 결과물을 명확히 설명",
    ],
  }),
  rep_labor_attorney: createPreset({
    label: "대표노무사 곽영준",
    defaultTone: "노무사 칼럼형, 법적 리스크를 쉽게 설명하는 신뢰형 톤",
    titleSuffix: "노무 실무 가이드",
    caseStudySuffix: "노무 상담 사례",
    playbook: [
      "노무사가 직접 설명하는 칼럼 문체 유지",
      "핵심 쟁점-판단기준-실무대응 순서로 전개",
      "독자가 헷갈리는 표현을 쉬운 용어로 치환",
    ],
  }),
  directions: createPreset({
    label: "오시는 길",
    defaultTone: "방문 안내형, 간결하고 친절한 톤",
    titleSuffix: "방문 안내 가이드",
    caseStudySuffix: "방문 상담 진행 사례",
    playbook: [
      "주소/교통/주차/방문 전 준비를 명확히 안내",
      "처음 방문하는 독자 기준 동선형 설명 사용",
      "문의 전 체크사항을 간단한 리스트로 제공",
    ],
  }),
  labor_legal_advisory: createPreset({
    label: "노동법률 자문",
    defaultTone: "법률 자문형, 쟁점 정리 중심 톤",
    titleSuffix: "노동법률 자문 가이드",
    caseStudySuffix: "노동법률 자문 사례",
    playbook: [
      "법률 자문이 필요한 상황을 먼저 정의",
      "사전 진단 포인트와 자문 후 기대효과를 분리",
      "실수하기 쉬운 리스크를 경고형 문장으로 제시",
    ],
  }),
  ai_asks_labor_answers: createPreset({
    label: "AI가 묻고 노무사가 답하다",
    defaultTone: "Q&A형, 쉬운 설명 중심 톤",
    titleSuffix: "노무 Q&A 가이드",
    caseStudySuffix: "질의응답 기반 사례",
    playbook: [
      "질문-답변 흐름을 유지하되 답변은 실행 중심",
      "자주 오해하는 포인트를 반례로 설명",
      "답변마다 체크해야 할 조건을 명시",
    ],
  }),
  advisory_cases: createPreset({
    label: "자문 사례",
    defaultTone: "사례 분석형, 문제-해결 구조 톤",
    titleSuffix: "자문 사례 분석",
    caseStudySuffix: "대표 자문 사례",
    playbook: [
      "문제상황-개입전략-결과를 숫자/지표로 요약",
      "사례는 익명화된 가상 형태로 구성",
      "사례 후 일반화 가능한 교훈 3가지를 제시",
    ],
  }),
  hr_er_consulting: createPreset({
    label: "HR·ER 컨설팅",
    defaultTone: "컨설팅 리포트형, 실행안 중심 톤",
    titleSuffix: "HR·ER 컨설팅 가이드",
    caseStudySuffix: "HR·ER 컨설팅 사례",
    playbook: [
      "조직 진단-설계-정착의 3단계로 설명",
      "경영진/실무자 관점 요구사항을 분리",
      "실행 순서와 예상 난관을 함께 제시",
    ],
  }),
  hr_system_design: createPreset({
    label: "HR 제도설계",
    defaultTone: "제도설계형, 체계적 설명 톤",
    titleSuffix: "HR 제도설계 가이드",
    caseStudySuffix: "HR 제도설계 사례",
    playbook: [
      "제도 목적과 평가 기준을 먼저 합의",
      "제도 설계 시 법적 리스크와 운영 리스크 분리",
      "도입 후 점검지표를 명확히 제시",
    ],
  }),
  hr_risk_management: createPreset({
    label: "HR 리스크관리",
    defaultTone: "리스크 매뉴얼형, 예방 중심 톤",
    titleSuffix: "HR 리스크관리 가이드",
    caseStudySuffix: "HR 리스크관리 사례",
    playbook: [
      "리스크를 발생확률/영향도로 구분",
      "예방조치와 사후대응을 분리한 구조 사용",
      "문서화·증빙 확보 항목을 반드시 포함",
    ],
  }),
  er_labor_relations: createPreset({
    label: "ER 노사관계",
    defaultTone: "노사관계 실무형, 균형 잡힌 톤",
    titleSuffix: "ER 노사관계 가이드",
    caseStudySuffix: "노사관계 관리 사례",
    playbook: [
      "노사 양측 신뢰를 해치지 않는 표현 사용",
      "갈등 발생 전 예방 대화를 강조",
      "분쟁 시 커뮤니케이션 원칙을 단계별 제시",
    ],
  }),
  er_collective_bargaining: createPreset({
    label: "ER 단체교섭",
    defaultTone: "단체교섭 전략형, 절차·논리 중심 톤",
    titleSuffix: "ER 단체교섭 가이드",
    caseStudySuffix: "단체교섭 대응 사례",
    playbook: [
      "교섭 준비-진행-합의 이행의 흐름 유지",
      "주요 쟁점별 우선순위 설정법 제시",
      "교섭 기록/합의문 문서화 포인트 포함",
    ],
  }),
  workplace_innovation_consulting: createPreset({
    label: "일터혁신컨설팅",
    defaultTone: "혁신 실행형, 변화관리 중심 톤",
    titleSuffix: "일터혁신 컨설팅 가이드",
    caseStudySuffix: "일터혁신 적용 사례",
    playbook: [
      "현황 진단에서 시작해 개선 로드맵까지 제시",
      "성과지표를 단기/중기 구분으로 제안",
      "현장 저항을 줄이는 실행 커뮤니케이션 포함",
    ],
  }),
  harassment_sexual: createPreset({
    label: "직장 내 괴롭힘·성희롱",
    defaultTone: "민감이슈 대응형, 보호·절차 중심 톤",
    titleSuffix: "괴롭힘·성희롱 대응 가이드",
    caseStudySuffix: "괴롭힘·성희롱 대응 사례",
    playbook: [
      "피해자 보호와 공정 절차를 동시에 강조",
      "민감 주제이므로 자극적 표현 금지",
      "신고 접수 후 즉시 해야 할 조치를 순서화",
    ],
  }),
  incident_investigation: createPreset({
    label: "사건조사 및 심의",
    defaultTone: "사건조사 매뉴얼형, 절차와 증빙 중심 톤",
    titleSuffix: "사건조사·심의 실무 가이드",
    caseStudySuffix: "사건조사·심의 사례",
    playbook: [
      "조사위원 구성·중립성 확보를 분명히 제시",
      "증거수집·진술정리·기록보존의 기준을 포함",
      "심의 후 후속조치와 재발방지까지 연결",
    ],
  }),
  report_related_advisory: createPreset({
    label: "신고 관련 자문",
    defaultTone: "신고 프로세스 안내형, 중립·보호 중심 톤",
    titleSuffix: "신고 관련 자문 가이드",
    caseStudySuffix: "신고 절차 자문 사례",
    playbook: [
      "신고 채널/보호조치/비밀보장 기준 명시",
      "무고·보복 우려에 대한 균형 잡힌 설명",
      "초기 대응 타임라인을 시간 순서로 제시",
    ],
  }),
  corporate_training: createPreset({
    label: "기업교육",
    defaultTone: "교육기획형, 실무 적용 중심 톤",
    titleSuffix: "기업교육 운영 가이드",
    caseStudySuffix: "기업교육 운영 사례",
    playbook: [
      "교육 목표-대상-성과측정 구조를 명확히 구성",
      "법정의무/실무교육을 구분해 안내",
      "교육 후 행동변화 체크리스트 포함",
    ],
  }),
  subsidy_application_support: createPreset({
    label: "지원금 신청 대행",
    defaultTone: "지원사업 안내형, 요건·절차 중심 톤",
    titleSuffix: "지원금 신청 가이드",
    caseStudySuffix: "지원금 신청 대행 사례",
    playbook: [
      "지원금 요건 확인 → 서류 준비 → 신청 후 관리 순서",
      "누락/반려 포인트를 경고형으로 제시",
      "일정 관리와 증빙 보관 팁 포함",
    ],
  }),
};

const DEFAULT_PRESET: PresetKey = "rep_labor_attorney";

function parsePreset(value: unknown): PresetKey {
  if (typeof value !== "string") {
    return DEFAULT_PRESET;
  }
  if (value in PRESET_CONFIG) {
    return value as PresetKey;
  }
  return DEFAULT_PRESET;
}

function normalizeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim();
}

function normalizeStringArray(value: unknown, min = 0, max = 10): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const list = value.map((item) => normalizeText(item)).filter(Boolean);
  if (list.length < min) {
    return [];
  }
  return list.slice(0, max);
}

function normalizeSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      const heading = normalizeText(row.heading);
      const lead = normalizeText(row.lead);
      const body = normalizeText(row.body);
      const bullets = normalizeStringArray(row.bullets, 0, 4);
      if (!heading || !lead || !body) {
        return null;
      }
      return { heading, lead, body, bullets };
    })
    .filter((item): item is BlogSection => item !== null)
    .slice(0, 5);
}

function normalizeFaq(value: unknown): BlogFaq[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      const question = normalizeText(row.question);
      const answer = normalizeText(row.answer);
      if (!question || !answer) {
        return null;
      }
      return { question, answer };
    })
    .filter((item): item is BlogFaq => item !== null)
    .slice(0, 4);
}

function normalizeHashtags(value: unknown, keyword: string): string[] {
  if (!Array.isArray(value)) {
    return [`#${keyword.replace(/\s+/g, "")}`];
  }

  const tags = value
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag.replace(/\s+/g, "")}`))
    .slice(0, 12);

  if (tags.length > 0) {
    return tags;
  }

  return [`#${keyword.replace(/\s+/g, "")}`];
}

function normalizeImagePrompts(value: unknown): SectionImagePrompt[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      const section = normalizeText(row.section);
      const prompt = normalizeText(row.prompt);
      if (!section || !prompt) {
        return null;
      }
      return { section, prompt };
    })
    .filter((item): item is SectionImagePrompt => item !== null)
    .slice(0, 12);
}

function buildFallbackImagePrompts(draft: BlogDraft, keyword: string): SectionImagePrompt[] {
  const prompts: SectionImagePrompt[] = [
    {
      section: "인트로",
      prompt: `${keyword} 주제를 상징하는 한국 직장/오피스 장면, 자연광, 현실적인 인물 구도, editorial photo, high detail, 16:9`,
    },
  ];

  for (const section of draft.sections) {
    prompts.push({
      section: section.heading,
      prompt: `${section.heading}를 시각화한 한국 비즈니스 현장, 전문직 컨설팅 분위기, 문서/회의 요소 포함, clean composition, editorial style, 16:9`,
    });
  }

  prompts.push({
    section: "사례",
    prompt: `${draft.caseStudy.title} 상황을 표현한 상담 테이블 장면, 중립적이고 신뢰감 있는 분위기, realistic photo style, 16:9`,
  });
  prompts.push({
    section: "마무리",
    prompt: `${keyword} 실행 체크리스트를 정리하는 장면, 노트북/문서/체크표시, 밝고 명확한 톤, realistic editorial photo, 16:9`,
  });

  return prompts.slice(0, 12);
}

function normalizeQualityReport(value: unknown): QualityReport {
  const row = (value ?? {}) as Record<string, unknown>;
  const rawScore = typeof row.score === "number" ? row.score : 0;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));
  const improvements = normalizeStringArray(row.improvements, 0, 5);
  return { score, improvements };
}

function normalizeStyleBlueprint(value: unknown): StyleBlueprint {
  const row = (value ?? {}) as Record<string, unknown>;
  return {
    voiceRules: normalizeStringArray(row.voiceRules, 0, 12),
    expertiseSignals: normalizeStringArray(row.expertiseSignals, 0, 12),
    forbiddenPatterns: normalizeStringArray(row.forbiddenPatterns, 0, 12),
    naverExposurePlaybook: normalizeStringArray(row.naverExposurePlaybook, 0, 16),
    qualityChecklist: normalizeStringArray(row.qualityChecklist, 0, 20),
  };
}

async function buildStyleBlueprint(params: {
  openai: ReturnType<typeof getOpenAI>;
  keyword: string;
  styleSample: string;
  sampledPosts: Array<{
    keyword: string;
    title: string;
    description: string;
    bloggerName: string;
    link: string;
    postDate: string;
  }>;
}): Promise<StyleBlueprint> {
  if (!params.styleSample && params.sampledPosts.length === 0) {
    return {
      voiceRules: [],
      expertiseSignals: [],
      forbiddenPatterns: [],
      naverExposurePlaybook: [],
      qualityChecklist: [],
    };
  }

  const completion = await params.openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "당신은 네이버 블로그 상위노출 전략가이자 전문 에디터다.",
          "문체 샘플에서 강점만 추출해 재사용 가능한 규칙으로 정리한다.",
          "네이버 샘플 포스트를 분석해 제목/서론/구조/체류시간 관점의 실행전략으로 변환한다.",
          "응답은 JSON만 출력한다.",
        ].join("\n"),
      },
      {
        role: "user",
        content: [
          `핵심 키워드: ${params.keyword}`,
          `사용자 문체 샘플:\n${params.styleSample || "미입력"}`,
          `네이버 상위 샘플: ${JSON.stringify(params.sampledPosts.slice(0, 30))}`,
          '출력 스키마: { "voiceRules": [""], "expertiseSignals": [""], "forbiddenPatterns": [""], "naverExposurePlaybook": [""], "qualityChecklist": [""] }',
          "조건: 허위 과장/낚시 표현 금지, 실행 가능한 규칙형 문장으로 작성",
        ].join("\n"),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return normalizeStyleBlueprint(parsed);
}

function buildMarkdown(draft: BlogDraft, imageUrl: string): string {
  const lines: string[] = [];

  lines.push(`# ${draft.title}`);
  lines.push("");
  lines.push(draft.introHook);
  lines.push("");
  lines.push(draft.introBody);
  lines.push("");

  lines.push("## 한눈에 핵심 요약");
  lines.push("");
  for (const item of draft.summaryBox) {
    lines.push(`- ${item}`);
  }
  lines.push("");

  lines.push(`![${draft.image.alt}](${imageUrl})`);
  if (draft.image.caption) {
    lines.push(`> ${draft.image.caption}`);
  }
  lines.push("");

  for (const section of draft.sections) {
    lines.push(`## ${section.heading}`);
    lines.push("");
    lines.push(section.lead);
    lines.push("");
    for (const bullet of section.bullets) {
      lines.push(`- ${bullet}`);
    }
    if (section.bullets.length > 0) {
      lines.push("");
    }
    lines.push(section.body);
    lines.push("");
  }

  lines.push("## 사례로 보는 적용 포인트");
  lines.push("");
  lines.push(`### ${draft.caseStudy.title}`);
  lines.push("");
  lines.push(`- 상황: ${draft.caseStudy.situation}`);
  lines.push(`- 대응: ${draft.caseStudy.solution}`);
  lines.push(`- 결과: ${draft.caseStudy.result}`);
  lines.push("");

  lines.push("## 실무 체크리스트");
  lines.push("");
  for (const item of draft.checklist) {
    lines.push(`- [ ] ${item}`);
  }
  lines.push("");

  lines.push("## 자주 묻는 질문 (FAQ)");
  lines.push("");
  for (const item of draft.faq) {
    lines.push(`### Q. ${item.question}`);
    lines.push("");
    lines.push(`A. ${item.answer}`);
    lines.push("");
  }

  lines.push("## 마무리");
  lines.push("");
  lines.push(draft.conclusion);
  lines.push("");

  lines.push("## 상담/문의 안내");
  lines.push("");
  lines.push(draft.cta);
  lines.push("");

  lines.push(draft.hashtags.join(" "));

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  // 1. Security Check
  const securityError = await withSecurity(req, { checkAuth: true, rateLimit: { limit: 5, windowMs: 60000 } });
  if (securityError) return securityError;

  // 2. Validation
  const validation = await validateBody(req, BlogWriterSchema);
  if (!validation.success) return validation.error;
  const body = validation.data;

  try {
    const preset = parsePreset(body.preset);
    const presetConfig = PRESET_CONFIG[preset];
    const keyword = normalizeText(body.keyword);
    const tone = normalizeText(body.tone, presetConfig.defaultTone);
    const length = body.length ?? "medium";
    const styleSample = normalizeText(body.styleSample);

    const lengthGuide: Record<NonNullable<RequestBody["length"]>, string> = {
      short: "총 1,000~1,500자",
      medium: "총 2,000~2,800자",
      long: "총 3,000~4,000자",
    };

    const openai = getOpenAI();
    const naverResearch = {
      available: false,
      reason: "DISABLED_FOR_NOW",
      sampledKeywords: [] as string[],
      sampledPosts: [] as Array<{
        keyword: string;
        title: string;
        description: string;
        bloggerName: string;
        link: string;
        postDate: string;
      }>,
    };
    const styleBlueprint =
      body.styleBlueprint
        ? normalizeStyleBlueprint(body.styleBlueprint)
        : await buildStyleBlueprint({
          openai,
          keyword,
          styleSample,
          sampledPosts: naverResearch.sampledPosts,
        });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.85,
      messages: [
        {
          role: "system",
          content: [
            ...presetConfig.systemRoleLines,
            "문장은 짧고 명확하게, 문단은 2~3문장 단위로 구성한다.",
            "형식적인 말보다 구체적인 행동 지침을 우선한다.",
            "SEO를 의식하되 키워드 반복/어색한 문장 금지.",
            "E-E-A-T(경험/전문성/권위/신뢰) 신호를 글 내부에 드러낸다.",
            "낚시형 제목, 과장형 문장, 단정형 법률자문 문장은 금지한다.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `주제 키워드: ${keyword}`,
            `프리셋: ${presetConfig.label}`,
            `문체/톤: ${tone}`,
            `분량 가이드: ${lengthGuide[length!]}`,
            `타깃 독자: ${presetConfig.targetAudience}`,
            `카테고리 플레이북: ${presetConfig.playbook.join(" / ")}`,
            `문체 샘플: ${styleSample || "미입력"}`,
            `문체 규칙: ${styleBlueprint.voiceRules.join(" / ") || "간결하고 전문적인 한국어 문체"}`,
            `전문성 신호: ${styleBlueprint.expertiseSignals.join(" / ") || "사례, 조건, 예외, 체크리스트를 포함"}`,
            `금지 패턴: ${styleBlueprint.forbiddenPatterns.join(" / ") || "근거 없는 과장, 반복 키워드, 추상적 미사여구"}`,
            `네이버 노출 플레이북: ${styleBlueprint.naverExposurePlaybook.join(" / ") || "문제-해결-체크리스트-FAQ 구조"}`,
            `네이버 상위 샘플: ${JSON.stringify(naverResearch.sampledPosts.slice(0, 8))}`,
            "출력 JSON 스키마:",
            '{ "title": "", "introHook": "", "introBody": "", "summaryBox": [""], "image": { "query": "", "alt": "", "caption": "" }, "sections": [ { "heading": "", "lead": "", "bullets": [""], "body": "" } ], "caseStudy": { "title": "", "situation": "", "solution": "", "result": "" }, "checklist": [""], "faq": [ { "question": "", "answer": "" } ], "conclusion": "", "cta": "", "hashtags": ["#태그"] }',
            "작성 규칙:",
            ...presetConfig.userRules,
            "- introHook: 첫 1~2문장 훅(문제 공감)",
            "- introBody: 2~3문장으로 글에서 얻을 이익 제시",
            "- summaryBox: 3~4개 핵심 포인트",
            "- sections: 3~5개",
            "- 각 section의 body는 구체 행동/주의사항 중심으로 작성",
            "- hashtags: 7~12개",
            "- 서론 3문장 안에 '누가, 어떤 문제를, 왜 지금 해결해야 하는지'를 명확히 제시",
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsedDraft = JSON.parse(raw) as Record<string, unknown>;

    const editCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: [
            "당신은 네이버 블로그 전문 에디터다.",
            "초안을 품질 기준으로 교정해 최종본을 만든다.",
            "품질 기준:",
            "1) 제목/서론이 문제를 즉시 제시하는가",
            "2) 본문이 실제 행동 가능한 지침을 제공하는가",
            "3) 군더더기 표현 없이 읽기 쉬운가",
            "4) 프리셋 카테고리 목적에 맞는가",
            "응답은 JSON만 출력한다.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `키워드: ${keyword}`,
            `프리셋: ${presetConfig.label}`,
            `카테고리 플레이북: ${presetConfig.playbook.join(" / ")}`,
            "아래 초안을 품질 높게 교정하고, 개선 포인트를 함께 반환하세요.",
            "출력 JSON 스키마:",
            '{ "draft": { "title": "", "introHook": "", "introBody": "", "summaryBox": [""], "image": { "query": "", "alt": "", "caption": "" }, "sections": [ { "heading": "", "lead": "", "bullets": [""], "body": "" } ], "caseStudy": { "title": "", "situation": "", "solution": "", "result": "" }, "checklist": [""], "faq": [ { "question": "", "answer": "" } ], "conclusion": "", "cta": "", "hashtags": ["#태그"] }, "imagePrompts": [ { "section": "", "prompt": "" } ], "qualityReport": { "score": 0, "improvements": [""] } }',
            `초안 JSON: ${JSON.stringify(parsedDraft)}`,
          ].join("\n"),
        },
      ],
    });

    const editedRaw = editCompletion.choices[0]?.message?.content ?? "{}";
    const editedParsed = JSON.parse(editedRaw) as Record<string, unknown>;
    const parsed =
      (editedParsed.draft as Record<string, unknown> | undefined) && typeof editedParsed.draft === "object"
        ? (editedParsed.draft as Record<string, unknown>)
        : parsedDraft;

    const criticCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: [
            "당신은 품질 감사자다. 블로그 글을 비평하고 구체적 개선지시를 작성한다.",
            "점수 기준: 전문성(25), 독창성(20), 가독성(20), 검색의도 적합성(20), 네이버 노출 구조 적합성(15).",
            "응답은 JSON만 출력한다.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `키워드: ${keyword}`,
            `문체 규칙: ${styleBlueprint.voiceRules.join(" / ")}`,
            `네이버 플레이북: ${styleBlueprint.naverExposurePlaybook.join(" / ")}`,
            `체크리스트: ${styleBlueprint.qualityChecklist.join(" / ")}`,
            `검토 대상 초안: ${JSON.stringify(parsed)}`,
            '출력: { "score": 0, "improvements": [""], "rewriteDirectives": [""] }',
          ].join("\n"),
        },
      ],
    });
    const criticRaw = criticCompletion.choices[0]?.message?.content ?? "{}";
    const criticParsed = JSON.parse(criticRaw) as Record<string, unknown>;
    const rewriteDirectives = normalizeStringArray((criticParsed as Record<string, unknown>).rewriteDirectives, 0, 10);

    let finalParsed = parsed;
    if (rewriteDirectives.length > 0) {
      const rewriteCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content: "당신은 시니어 블로그 에디터다. 지시사항을 반영해 초안을 개선한다. 응답은 JSON만 출력한다.",
          },
          {
            role: "user",
            content: [
              `키워드: ${keyword}`,
              `문체 샘플: ${styleSample || "미입력"}`,
              `문체 규칙: ${styleBlueprint.voiceRules.join(" / ")}`,
              `네이버 노출 플레이북: ${styleBlueprint.naverExposurePlaybook.join(" / ")}`,
              `개선 지시: ${rewriteDirectives.join(" / ")}`,
              `입력 초안: ${JSON.stringify(parsed)}`,
              '출력 스키마: { "draft": { "title": "", "introHook": "", "introBody": "", "summaryBox": [""], "image": { "query": "", "alt": "", "caption": "" }, "sections": [ { "heading": "", "lead": "", "bullets": [""], "body": "" } ], "caseStudy": { "title": "", "situation": "", "solution": "", "result": "" }, "checklist": [""], "faq": [ { "question": "", "answer": "" } ], "conclusion": "", "cta": "", "hashtags": ["#태그"] } }',
            ].join("\n"),
          },
        ],
      });
      const rewriteRaw = rewriteCompletion.choices[0]?.message?.content ?? "{}";
      const rewriteParsed = JSON.parse(rewriteRaw) as Record<string, unknown>;
      if (rewriteParsed.draft && typeof rewriteParsed.draft === "object") {
        finalParsed = rewriteParsed.draft as Record<string, unknown>;
      }
    }

    const editedQuality = normalizeQualityReport(editedParsed.qualityReport);
    const criticImprovements = normalizeStringArray(criticParsed.improvements, 0, 5);
    const qualityReport = normalizeQualityReport({
      score: criticParsed.score,
      improvements: criticImprovements.length > 0 ? criticImprovements : editedQuality.improvements,
    });

    const sections = normalizeSections(finalParsed.sections);
    const summaryBox = normalizeStringArray(finalParsed.summaryBox, 1, 4);
    const checklist = normalizeStringArray(finalParsed.checklist, 1, 7);
    const faq = normalizeFaq(finalParsed.faq);

    const draft: BlogDraft = {
      title: normalizeText(
        finalParsed.title,
        `${keyword} ${presetConfig.titleSuffix}`,
      ),
      introHook: normalizeText(
        finalParsed.introHook,
        `${keyword}, 어디서부터 시작해야 할지 막막하셨다면 이 글이 기준을 잡아드립니다.`,
      ),
      introBody: normalizeText(
        finalParsed.introBody,
        preset === "rep_labor_attorney" || preset === "incident_investigation"
          ? `이 글에서는 ${keyword} 관련 노무 리스크와 실무 대응 순서를 현장 기준으로 정리합니다.`
          : `이 글에서는 ${keyword}의 핵심 원리와 현장 적용 포인트를 바로 실행 가능하게 정리합니다.`,
      ),
      summaryBox:
        summaryBox.length > 0
          ? summaryBox
          : [
            `${keyword} 핵심 구조를 먼저 이해합니다.`,
            "실무에서 자주 놓치는 리스크를 점검합니다.",
            "바로 실행 가능한 체크리스트를 제공합니다.",
          ],
      image: {
        query: normalizeText((finalParsed.image as Record<string, unknown>)?.query, keyword),
        alt: normalizeText((finalParsed.image as Record<string, unknown>)?.alt, `${keyword} 관련 대표 이미지`),
        caption: normalizeText((finalParsed.image as Record<string, unknown>)?.caption, `${keyword} 핵심 포인트를 보여주는 이미지`),
      },
      sections:
        sections.length > 0
          ? sections
          : [
            {
              heading: `${keyword} 핵심 개념`,
              lead: `${keyword}를 이해할 때 먼저 봐야 할 기준부터 정리합니다.`,
              bullets: ["문제 정의", "적용 범위", "실무 리스크"],
              body: "실무에서는 기준이 모호하면 의사결정이 늦어지고 비용이 커집니다. 기본 개념을 먼저 고정한 뒤 세부 전략을 정하는 방식이 가장 안전합니다.",
            },
          ],
      caseStudy: {
        title: normalizeText(
          (finalParsed.caseStudy as Record<string, unknown>)?.title,
          `${keyword} ${presetConfig.caseStudySuffix}`,
        ),
        situation: normalizeText((finalParsed.caseStudy as Record<string, unknown>)?.situation, `${keyword} 관련 이슈로 내부 의사결정이 지연된 상황`),
        solution: normalizeText((finalParsed.caseStudy as Record<string, unknown>)?.solution, "핵심 쟁점을 우선순위로 나누고 단계별 실행안을 설계"),
        result: normalizeText((finalParsed.caseStudy as Record<string, unknown>)?.result, "불확실성이 줄고 실행 속도가 개선됨"),
      },
      checklist:
        checklist.length > 0
          ? checklist
          : [
            "현 상황을 1문장으로 정의한다",
            "핵심 리스크 3가지를 먼저 적는다",
            "내부 담당자와 일정/책임자를 지정한다",
            "필요 서류/데이터를 사전에 정리한다",
            "전문가 검토 포인트를 체크한다",
          ],
      faq:
        faq.length > 0
          ? faq
          : [
            {
              question: `${keyword}를 바로 적용해도 되나요?`,
              answer: "현재 상황과 요건을 먼저 확인한 뒤 적용 범위를 좁혀 시작하는 것이 안전합니다.",
            },
            {
              question: "어떤 자료를 먼저 준비하면 좋나요?",
              answer: "최근 이슈 사례, 내부 기준 문서, 일정 계획표를 먼저 준비하면 상담 효율이 높아집니다.",
            },
          ],
      conclusion: normalizeText(finalParsed.conclusion, `${keyword}는 구조를 이해하고 순서대로 실행하면 성과가 빠르게 나는 주제입니다. 오늘 체크리스트부터 적용해 보세요.`),
      cta: normalizeText(finalParsed.cta, "현재 상황에 맞춘 실행안을 원하시면 사례 기준으로 간단 진단해드리겠습니다. 댓글이나 문의로 핵심 상황만 남겨주시면 바로 방향을 잡아드리겠습니다."),
      hashtags: normalizeHashtags(finalParsed.hashtags, keyword),
    };

    const imageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(draft.image.query || keyword)}`;
    const markdown = buildMarkdown(draft, imageUrl);
    const imagePromptsRaw = normalizeImagePrompts(editedParsed.imagePrompts);
    const imagePrompts = imagePromptsRaw.length > 0 ? imagePromptsRaw : buildFallbackImagePrompts(draft, keyword);

    return NextResponse.json({
      draft,
      imageUrl,
      markdown,
      imagePrompts,
      qualityReport,
      styleBlueprint,
      naverResearch,
    });
  } catch (error) {
    console.error("Blog writer error:", error);
    return NextResponse.json(
      { error: "글 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
