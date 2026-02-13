import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

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

type RequestBody = {
  keyword?: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  preset?: PresetKey;
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

type PresetConfig = {
  label: string;
  defaultTone: string;
  targetAudience: string;
  systemRoleLines: string[];
  userRules: string[];
  titleSuffix: string;
  caseStudySuffix: string;
};

function createPreset(config: {
  label: string;
  defaultTone: string;
  titleSuffix: string;
  caseStudySuffix: string;
  targetAudience?: string;
  systemRoleLines?: string[];
  userRules?: string[];
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
  }),
  rep_labor_attorney: createPreset({
    label: "대표노무사 곽영준",
    defaultTone: "노무사 칼럼형, 법적 리스크를 쉽게 설명하는 신뢰형 톤",
    titleSuffix: "노무 실무 가이드",
    caseStudySuffix: "노무 상담 사례",
  }),
  directions: createPreset({
    label: "오시는 길",
    defaultTone: "방문 안내형, 간결하고 친절한 톤",
    titleSuffix: "방문 안내 가이드",
    caseStudySuffix: "방문 상담 진행 사례",
  }),
  cpla_ai: createPreset({
    label: "CPLA + AI",
    defaultTone: "노무+AI 융합 인사이트형, 실무 자동화 중심 톤",
    titleSuffix: "노무 AI 적용 가이드",
    caseStudySuffix: "노무 AI 적용 사례",
  }),
  labor_legal_advisory: createPreset({
    label: "노동법률 자문",
    defaultTone: "법률 자문형, 쟁점 정리 중심 톤",
    titleSuffix: "노동법률 자문 가이드",
    caseStudySuffix: "노동법률 자문 사례",
  }),
  ai_asks_labor_answers: createPreset({
    label: "AI가 묻고 노무사가 답하다",
    defaultTone: "Q&A형, 쉬운 설명 중심 톤",
    titleSuffix: "노무 Q&A 가이드",
    caseStudySuffix: "질의응답 기반 사례",
  }),
  advisory_cases: createPreset({
    label: "자문 사례",
    defaultTone: "사례 분석형, 문제-해결 구조 톤",
    titleSuffix: "자문 사례 분석",
    caseStudySuffix: "대표 자문 사례",
  }),
  hr_er_consulting: createPreset({
    label: "HR·ER 컨설팅",
    defaultTone: "컨설팅 리포트형, 실행안 중심 톤",
    titleSuffix: "HR·ER 컨설팅 가이드",
    caseStudySuffix: "HR·ER 컨설팅 사례",
  }),
  hr_system_design: createPreset({
    label: "HR 제도설계",
    defaultTone: "제도설계형, 체계적 설명 톤",
    titleSuffix: "HR 제도설계 가이드",
    caseStudySuffix: "HR 제도설계 사례",
  }),
  hr_risk_management: createPreset({
    label: "HR 리스크관리",
    defaultTone: "리스크 매뉴얼형, 예방 중심 톤",
    titleSuffix: "HR 리스크관리 가이드",
    caseStudySuffix: "HR 리스크관리 사례",
  }),
  er_labor_relations: createPreset({
    label: "ER 노사관계",
    defaultTone: "노사관계 실무형, 균형 잡힌 톤",
    titleSuffix: "ER 노사관계 가이드",
    caseStudySuffix: "노사관계 관리 사례",
  }),
  er_collective_bargaining: createPreset({
    label: "ER 단체교섭",
    defaultTone: "단체교섭 전략형, 절차·논리 중심 톤",
    titleSuffix: "ER 단체교섭 가이드",
    caseStudySuffix: "단체교섭 대응 사례",
  }),
  workplace_innovation_consulting: createPreset({
    label: "일터혁신컨설팅",
    defaultTone: "혁신 실행형, 변화관리 중심 톤",
    titleSuffix: "일터혁신 컨설팅 가이드",
    caseStudySuffix: "일터혁신 적용 사례",
  }),
  harassment_sexual: createPreset({
    label: "직장 내 괴롭힘·성희롱",
    defaultTone: "민감이슈 대응형, 보호·절차 중심 톤",
    titleSuffix: "괴롭힘·성희롱 대응 가이드",
    caseStudySuffix: "괴롭힘·성희롱 대응 사례",
  }),
  incident_investigation: createPreset({
    label: "사건조사 및 심의",
    defaultTone: "사건조사 매뉴얼형, 절차와 증빙 중심 톤",
    titleSuffix: "사건조사·심의 실무 가이드",
    caseStudySuffix: "사건조사·심의 사례",
  }),
  report_related_advisory: createPreset({
    label: "신고 관련 자문",
    defaultTone: "신고 프로세스 안내형, 중립·보호 중심 톤",
    titleSuffix: "신고 관련 자문 가이드",
    caseStudySuffix: "신고 절차 자문 사례",
  }),
  corporate_training: createPreset({
    label: "기업교육",
    defaultTone: "교육기획형, 실무 적용 중심 톤",
    titleSuffix: "기업교육 운영 가이드",
    caseStudySuffix: "기업교육 운영 사례",
  }),
  subsidy_application_support: createPreset({
    label: "지원금 신청 대행",
    defaultTone: "지원사업 안내형, 요건·절차 중심 톤",
    titleSuffix: "지원금 신청 가이드",
    caseStudySuffix: "지원금 신청 대행 사례",
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const preset = parsePreset(body.preset);
    const presetConfig = PRESET_CONFIG[preset];
    const keyword = normalizeText(body.keyword);
    const tone = normalizeText(body.tone, presetConfig.defaultTone);
    const length = body.length ?? "medium";

    if (!keyword) {
      return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
    }

    const lengthGuide: Record<NonNullable<RequestBody["length"]>, string> = {
      short: "총 1,000~1,500자",
      medium: "총 2,000~2,800자",
      long: "총 3,000~4,000자",
    };

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.75,
      messages: [
        {
          role: "system",
          content: presetConfig.systemRoleLines.join("\n"),
        },
        {
          role: "user",
          content: [
            `주제 키워드: ${keyword}`,
            `프리셋: ${presetConfig.label}`,
            `문체/톤: ${tone}`,
            `분량 가이드: ${lengthGuide[length]}`,
            `타깃 독자: ${presetConfig.targetAudience}`,
            "출력 JSON 스키마:",
            '{ "title": "", "introHook": "", "introBody": "", "summaryBox": [""], "image": { "query": "", "alt": "", "caption": "" }, "sections": [ { "heading": "", "lead": "", "bullets": [""], "body": "" } ], "caseStudy": { "title": "", "situation": "", "solution": "", "result": "" }, "checklist": [""], "faq": [ { "question": "", "answer": "" } ], "conclusion": "", "cta": "", "hashtags": ["#태그"] }',
            "작성 규칙:",
            ...presetConfig.userRules,
            "- introHook: 첫 1~2문장 훅(문제 공감)",
            "- introBody: 2~3문장으로 글에서 얻을 이익 제시",
            "- summaryBox: 3~4개 핵심 포인트",
            "- sections: 3~5개",
            "- hashtags: 7~12개",
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const sections = normalizeSections(parsed.sections);
    const summaryBox = normalizeStringArray(parsed.summaryBox, 1, 4);
    const checklist = normalizeStringArray(parsed.checklist, 1, 7);
    const faq = normalizeFaq(parsed.faq);

    const draft: BlogDraft = {
      title: normalizeText(
        parsed.title,
        `${keyword} ${presetConfig.titleSuffix}`,
      ),
      introHook: normalizeText(
        parsed.introHook,
        `${keyword}, 어디서부터 시작해야 할지 막막하셨다면 이 글이 기준을 잡아드립니다.`,
      ),
      introBody: normalizeText(
        parsed.introBody,
        preset === "rep_labor_attorney" || preset === "incident_investigation"
          ? `이 글에서는 ${keyword} 관련 노무 리스크와 실무 대응 순서를 현장 기준으로 정리합니다.`
          : `이 글에서는 ${keyword}의 핵심 원리와 AI/실무 적용 포인트를 바로 실행 가능하게 정리합니다.`,
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
        query: normalizeText((parsed.image as Record<string, unknown>)?.query, keyword),
        alt: normalizeText((parsed.image as Record<string, unknown>)?.alt, `${keyword} 관련 대표 이미지`),
        caption: normalizeText((parsed.image as Record<string, unknown>)?.caption, `${keyword} 핵심 포인트를 보여주는 이미지`),
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
          (parsed.caseStudy as Record<string, unknown>)?.title,
          `${keyword} ${presetConfig.caseStudySuffix}`,
        ),
        situation: normalizeText((parsed.caseStudy as Record<string, unknown>)?.situation, `${keyword} 관련 이슈로 내부 의사결정이 지연된 상황`),
        solution: normalizeText((parsed.caseStudy as Record<string, unknown>)?.solution, "핵심 쟁점을 우선순위로 나누고 단계별 실행안을 설계"),
        result: normalizeText((parsed.caseStudy as Record<string, unknown>)?.result, "불확실성이 줄고 실행 속도가 개선됨"),
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
      conclusion: normalizeText(parsed.conclusion, `${keyword}는 구조를 이해하고 순서대로 실행하면 성과가 빠르게 나는 주제입니다. 오늘 체크리스트부터 적용해 보세요.`),
      cta: normalizeText(parsed.cta, "현재 상황에 맞춘 실행안을 원하시면 사례 기준으로 간단 진단해드리겠습니다. 댓글이나 문의로 핵심 상황만 남겨주시면 바로 방향을 잡아드리겠습니다."),
      hashtags: normalizeHashtags(parsed.hashtags, keyword),
    };

    const imageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(draft.image.query || keyword)}`;
    const markdown = buildMarkdown(draft, imageUrl);

    return NextResponse.json({
      draft,
      imageUrl,
      markdown,
    });
  } catch (error) {
    console.error("Blog writer error:", error);
    return NextResponse.json(
      { error: "글 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}
