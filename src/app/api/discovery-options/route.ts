import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { buildWorkflowInfographicDataUrl, buildWorkflowSteps } from "@/lib/workflowInfographic";
import { BASE_LABOR_SERVICES } from "@/lib/laborServicesCatalog";
import { getOpenAI } from "@/lib/openai";
import { inferByExamples, type DiscoveryExampleSignals } from "@/lib/discoveryExampleMatcher";

type Body = {
  situation: string;
  answers?: string[];
  round: number;
};

type Category = "none" | "wage_arrears" | "dismissal" | "harassment" | "industrial_accident" | "contract" | "other";

type DiscoveryResponse =
  | {
      stage: "ask";
      keyword: string;
      question: string;
      focusInfo: string;
      quickServices: { name: string; description: string; workflowSteps: string[]; workflowInfographic: string }[];
      round: number;
    }
  | {
      stage: "finalize";
      recommendedServices: { name: string; description: string; workflowSteps: string[]; workflowInfographic: string }[];
      intakeSummary: string;
    };

type ManagedService = {
  name: string;
  description: string;
  audience?: "worker" | "employer";
  keywords?: string[];
  workflowSteps?: string[];
  workflowInfographic?: string;
};

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

const CATEGORY_KEYWORDS: Record<Exclude<Category, "none" | "other">, string[]> = {
  wage_arrears: [
    "임금",
    "체불",
    "월급",
    "급여",
    "수당",
    "퇴직금",
    "미지급",
    "대지급금",
    "체당금",
    "정산",
  ],
  dismissal: [
    "해고",
    "권고사직",
    "징계",
    "정직",
    "감봉",
    "대기발령",
    "부당",
    "해지",
    "면직",
    "사직강요",
  ],
  harassment: ["괴롭힘", "폭언", "모욕", "따돌림", "갑질", "성희롱", "괴롭", "인격", "왕따"],
  industrial_accident: ["산재", "재해", "부상", "출근길", "업무상", "요양", "장해", "산업재해"],
  contract: [
    "근로계약",
    "근로조건",
    "연장근로",
    "휴게",
    "연차",
    "근무표",
    "시프트",
    "근무시간",
    "4대보험",
    "취업규칙",
    "인사규정",
    "임금체계",
    "보상체계",
    "파견",
    "도급",
    "노사협의회",
    "단체교섭",
  ],
};

const NO_ISSUE_PATTERNS = [
  "아무 문제가 없어",
  "아무 문제 없어",
  "문제 없어",
  "문제없어",
  "문제는 없어",
  "별일 없어",
  "특별한 문제 없어",
  "그냥 궁금",
  "상담만",
];

const WAGE_SYSTEM_SIGNALS = [
  "임금체계",
  "임금구조",
  "보상체계",
  "급여체계",
  "연봉제",
  "직무급",
  "성과급",
  "인센티브",
  "개편",
  "개선",
  "설계",
  "제도",
];

const WAGE_ARREARS_SIGNALS = [
  "임금체불",
  "체불",
  "미지급",
  "지급지연",
  "체당금",
  "대지급금",
  "진정",
  "퇴직금미지급",
];

const EMPLOYER_INTENT_SIGNALS = [
  "사업주",
  "회사",
  "대표",
  "인사팀",
  "hr",
  "인사담당",
  "운영",
  "도입",
  "정비",
  "컴플라이언스",
  "취업규칙",
  "인사평가",
  "임금체계",
  "보상체계",
  "직무급",
  "성과급",
  "연봉제",
  "파견",
  "도급",
  "원하청",
  "협력사",
  "단체교섭",
  "단체협약",
  "노조",
  "노사협의회",
  "근로감독",
  "고충처리",
];

function includesAny(text: string, patterns: string[]) {
  return patterns.some((p) => text.includes(p));
}

function normalize(text: string) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function scoreCategory(text: string, keywords: string[]) {
  return keywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
}

function countMatches(text: string, terms: string[]) {
  return terms.reduce((acc, term) => acc + (text.includes(normalize(term)) ? 1 : 0), 0);
}

function detectCategory(text: string, exampleHint?: DiscoveryExampleSignals): Category {
  const normalized = normalize(text);

  if (!normalized || includesAny(normalized, NO_ISSUE_PATTERNS)) {
    return "none";
  }

  const wageSystemScore = countMatches(normalized, WAGE_SYSTEM_SIGNALS);
  const wageArrearsScore = countMatches(normalized, WAGE_ARREARS_SIGNALS);
  const contractIntentScore = countMatches(normalized, [
    "취업규칙",
    "인사규정",
    "단체교섭",
    "단체협약",
    "파견",
    "도급",
    "노사협의회",
    "평가제도",
    "보상체계",
    "근로감독",
    "노동청근로감독",
    "컴플라이언스",
  ]);

  if (wageSystemScore > 0 && wageSystemScore >= wageArrearsScore) {
    return "contract";
  }
  if (wageArrearsScore > 0 && wageArrearsScore > wageSystemScore) {
    return "wage_arrears";
  }
  if (contractIntentScore > 0 && wageArrearsScore === 0) {
    return "contract";
  }
  if (exampleHint?.category && exampleHint.confidence >= 0.35) {
    return exampleHint.category as Category;
  }

  let maxScore = 0;
  let picked: Category = "other";

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as Array<[Exclude<Category, "none" | "other">, string[]]>) {
    const score = scoreCategory(normalized, keywords);
    if (score > maxScore) {
      maxScore = score;
      picked = category;
    }
  }

  return maxScore > 0 ? picked : "other";
}

function detectInsolvency(text: string) {
  const normalized = normalize(text);
  return includesAny(normalized, ["폐업", "도산", "파산", "회생", "청산", "연락두절"]);
}

function readManagedServices(): ManagedService[] {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return [];
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as {
      labor_services?: ManagedService[];
      labor_services_worker?: ManagedService[];
      labor_services_employer?: ManagedService[];
    };
    const legacy = Array.isArray(parsed.labor_services)
      ? parsed.labor_services.map((s) => ({ ...s, audience: "worker" as const }))
      : [];
    const workers = Array.isArray(parsed.labor_services_worker)
      ? parsed.labor_services_worker.map((s) => ({ ...s, audience: "worker" as const }))
      : [];
    const employers = Array.isArray(parsed.labor_services_employer)
      ? parsed.labor_services_employer.map((s) => ({ ...s, audience: "employer" as const }))
      : [];
    return [...legacy, ...workers, ...employers]
      .map((s) => ({
        name: String(s?.name || "").trim(),
        description: String(s?.description || "").trim(),
        audience: (s?.audience === "employer" ? "employer" : "worker") as "worker" | "employer",
        keywords: Array.isArray(s?.keywords)
          ? s.keywords.map((k) => String(k || "").trim()).filter(Boolean)
          : [],
        workflowSteps: Array.isArray(s?.workflowSteps)
          ? s.workflowSteps.map((w) => String(w || "").trim()).filter(Boolean)
          : undefined,
        workflowInfographic: typeof s?.workflowInfographic === "string" ? String(s.workflowInfographic) : undefined,
      }))
      .filter((s) => s.name && s.description);
  } catch (error) {
    console.error("Failed to read managed services:", error);
    return [];
  }
}

function buildAutoWorkflow(serviceName: string) {
  return [
    `${serviceName} 관련 초기 사실관계 진단`,
    "핵심 증빙자료 정리 및 쟁점 구조화",
    "대응 절차 수립 및 실행 일정 확정",
    "진행 결과 안내 및 후속 조치 제안",
  ];
}

function inferKeywords(service: ManagedService) {
  const base = `${service.name} ${service.description}`;
  const parts = base
    .split(/[\s,./()·\-:;]+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 2);
  const unique = Array.from(new Set(parts));
  return unique.slice(0, 14);
}

function scoreService(service: ManagedService, text: string, exampleSignals?: DiscoveryExampleSignals) {
  const normalized = normalize(text);
  const keywords = (service.keywords && service.keywords.length > 0 ? service.keywords : inferKeywords(service)).map(normalize);
  const serviceText = normalize(`${service.name} ${service.description} ${(service.keywords || []).join(" ")}`);
  const baseScore = keywords.reduce((acc, keyword) => {
    if (!keyword || !normalized.includes(keyword)) return acc;
    return acc + (keyword.length >= 4 ? 2 : 1);
  }, 0);

  let adjustment = 0;
  const queryWageSystem = countMatches(normalized, WAGE_SYSTEM_SIGNALS);
  const queryWageArrears = countMatches(normalized, WAGE_ARREARS_SIGNALS);
  const serviceWageSystem = countMatches(serviceText, WAGE_SYSTEM_SIGNALS);
  const serviceWageArrears = countMatches(serviceText, WAGE_ARREARS_SIGNALS);

  if (queryWageSystem > 0 && serviceWageSystem > 0) adjustment += 6;
  if (queryWageArrears > 0 && serviceWageArrears > 0) adjustment += 6;
  if (queryWageSystem > 0 && serviceWageArrears > 0 && serviceWageSystem === 0) adjustment -= 8;
  if (queryWageArrears > 0 && serviceWageSystem > 0 && serviceWageArrears === 0) adjustment -= 4;

  const exampleBoost = (exampleSignals?.serviceScores[service.name] || 0) * 10;
  return baseScore + adjustment + exampleBoost;
}

async function rankServicesWithAI(
  services: ManagedService[],
  combinedText: string,
  audience: "worker" | "employer"
): Promise<string[]> {
  if (services.length === 0) return [];
  try {
    const openai = getOpenAI();
    const catalog = services.map((s, idx) => ({
      idx,
      name: s.name,
      description: s.description,
      audience: s.audience || audience,
    }));

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 노무 서비스 매칭기다. 키워드 단순 일치가 아니라 사용자의 의도, 목표, 상황의 맥락을 보고 가장 적합한 서비스 3개를 고른다. 반드시 제공된 카탈로그 안에서만 고른다.",
        },
        {
          role: "user",
          content: `사용자 유형: ${audience === "employer" ? "사업주/인사담당자" : "근로자"}
사용자 입력:
${combinedText}

서비스 카탈로그(JSON):
${JSON.stringify(catalog)}

규칙:
1) 반드시 카탈로그의 idx만 선택
2) 총 3개 선택
3) 이름 유사성보다 실제 업무 목적 적합도를 우선
4) "임금체계 개선" 같은 문의는 "임금체불"보다 "임금체계 개편 자문" 계열을 우선

JSON으로만 답변:
{ "picked_idx": [0,1,2] }`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as { picked_idx?: number[] };
    const picked = Array.isArray(parsed.picked_idx) ? parsed.picked_idx : [];
    const names = picked
      .map((i) => (typeof i === "number" ? services[i] : null))
      .filter((s): s is ManagedService => Boolean(s))
      .map((s) => s.name);
    return Array.from(new Set(names)).slice(0, 3);
  } catch (error) {
    console.error("AI service ranking failed, fallback to keyword ranking:", error);
    return [];
  }
}

function getKeywordLabel(category: Category) {
  switch (category) {
    case "wage_arrears":
      return "임금체불";
    case "dismissal":
      return "부당해고·징계";
    case "harassment":
      return "직장 내 괴롭힘";
    case "industrial_accident":
      return "산업재해";
    case "contract":
      return "근로조건·근무체계";
    case "none":
      return "잠재 노무리스크";
    case "other":
    default:
      return "근로관계 분쟁 가능성";
  }
}

type ExtractedFacts = {
  amount?: string;
  when?: string;
  hasEvidence: boolean;
  reportedToAgency: boolean;
  reportedInCompany: boolean;
  wantsFast: boolean;
  wantsCompensation: boolean;
  wantsReinstatement: boolean;
};

type Audience = "worker" | "employer";
type ContractSubtype = "wage_system" | "rules" | "labor_relations" | "outsourcing" | "compliance" | "general";

function extractFacts(text: string): ExtractedFacts {
  const raw = String(text || "");
  const normalized = normalize(raw);

  const amountMatch = raw.match(/(\d{1,3}(,\d{3})*(\.\d+)?\s*(원|만원|천원))/);
  const dateMatch =
    raw.match(/(\d{4}[./-]\d{1,2}[./-]\d{1,2})/) ||
    raw.match(/((최근|지난)\s*\d+\s*(일|주|개월|달|년))/);

  return {
    amount: amountMatch?.[1],
    when: dateMatch?.[1],
    hasEvidence: includesAny(normalized, ["문자", "카톡", "메일", "녹취", "녹음", "증거", "캡처", "명세서", "근로계약서"]),
    reportedToAgency: includesAny(normalized, ["노동청신고", "진정", "고소", "접수", "신고완료", "신고했"]),
    reportedInCompany: includesAny(normalized, ["사내신고", "인사팀", "대표에게", "신고했", "고충처리"]),
    wantsFast: includesAny(normalized, ["빨리", "즉시", "당장", "긴급", "최대한빨리"]),
    wantsCompensation: includesAny(normalized, ["보상", "배상", "합의금", "금전", "돈", "지급"]),
    wantsReinstatement: includesAny(normalized, ["복직", "원직", "돌아가", "직장복귀"]),
  };
}

function detectAudience(text: string, exampleHint?: DiscoveryExampleSignals): Audience {
  const normalized = normalize(text);
  if (countMatches(normalized, EMPLOYER_INTENT_SIGNALS) > 0) {
    return "employer";
  }
  if (exampleHint?.audience && exampleHint.confidence >= 0.3) {
    return exampleHint.audience as Audience;
  }
  const employerSignals = [
    "사업주",
    "대표",
    "사용자",
    "회사입장",
    "회사측",
    "인사팀",
    "hr",
    "인사담당",
    "노무관리",
    "징계하려",
    "해고하려",
    "취업규칙",
    "근로감독대응",
    "노사협의회",
    "단체교섭",
    "직원",
    "근로자관리",
  ];
  return includesAny(normalized, employerSignals) ? "employer" : "worker";
}

function detectContractSubtype(text: string): ContractSubtype {
  const normalized = normalize(text);
  if (countMatches(normalized, ["임금체계", "직무급", "성과급", "연봉제", "통상임금", "평균임금", "보상체계"]) > 0) {
    return "wage_system";
  }
  if (countMatches(normalized, ["취업규칙", "인사규정", "근로계약", "평가제도", "규정정비"]) > 0) {
    return "rules";
  }
  if (countMatches(normalized, ["단체교섭", "단체협약", "노조", "쟁의", "직장폐쇄", "노사협의회"]) > 0) {
    return "labor_relations";
  }
  if (countMatches(normalized, ["파견", "도급", "불법파견", "원하청", "협력사"]) > 0) {
    return "outsourcing";
  }
  if (countMatches(normalized, ["근로감독", "컴플라이언스", "법정의무", "4대보험", "노동청"]) > 0) {
    return "compliance";
  }
  return "general";
}

function buildSecondQuestion(category: Category, combinedText: string) {
  const audience = detectAudience(combinedText);
  const contractSubtype = category === "contract" ? detectContractSubtype(combinedText) : "general";

  switch (category) {
    case "wage_arrears":
      return {
        question:
          audience === "employer"
            ? "현재 가장 먼저 풀고 싶은 과제는 무엇인가요? (예: 체불 해소, 진정 리스크 축소, 재발 방지) 그리고 미지급이 발생한 핵심 원인 1~2가지를 알려주세요."
            : "가장 회수하고 싶은 금액 항목은 무엇인가요? (기본급/수당/퇴직금) 그리고 언제부터 밀렸는지, 회사와 마지막으로 합의 시도한 내용도 알려주세요.",
        focusInfo: "핵심 파악 포인트: 금액 우선순위, 발생 기간, 현재 협의 단계",
      };
    case "dismissal":
      return {
        question:
          audience === "employer"
            ? "이번 인사조치의 목적이 무엇인가요? (조직질서 회복, 리스크 차단, 퇴출 등) 그리고 회사가 반드시 지키고 싶은 원칙 1~2가지를 알려주세요."
            : "원하는 결과가 복직인지, 조건 협의인지, 조용한 정리인지 먼저 알려주세요. 그리고 회사 통보 방식(구두/문서)과 시점도 함께 알려주세요.",
        focusInfo: "핵심 파악 포인트: 최종 목표, 통보/절차 상태, 협상 여지",
      };
    case "harassment":
      return {
        question:
          audience === "employer"
            ? "이번 사안을 통해 회사가 달성하려는 목표가 무엇인가요? (신속 종결, 공정 조사, 재발 방지) 그리고 현재 조직 내 갈등 강도도 알려주세요."
            : "가장 힘들었던 장면 1건을 기준으로, 어떤 행동이 반복됐는지와 내가 원하는 결과(중단/사과/분리/보상)를 알려주세요.",
        focusInfo: "핵심 파악 포인트: 원하는 해결 상태, 반복 패턴, 관계 악화 정도",
      };
    case "industrial_accident":
      return {
        question:
          audience === "employer"
            ? "이번 재해 대응에서 회사가 가장 우선하는 목표는 무엇인가요? (근로자 보호, 법적 리스크 최소화, 현장 정상화) 그리고 현재 조치 단계도 알려주세요."
            : "지금 가장 필요한 지원이 무엇인가요? (산재 승인, 치료비/휴업급여, 장해급여 준비) 그리고 치료 일정과 업무복귀 계획을 알려주세요.",
        focusInfo: "핵심 파악 포인트: 현재 치료/조치 단계, 급여 목표, 복귀 계획",
      };
    case "contract":
      return {
        question:
          audience === "employer"
            ? contractSubtype === "wage_system"
              ? "개편이 필요한 가장 큰 이유는 무엇인가요? 그리고 직원 수(또는 대상 조직 규모)와 인건비 예산 범위를 알려주세요."
              : contractSubtype === "rules"
                ? "정비하려는 규정은 무엇인가요? (취업규칙/근로계약/인사평가/징계 등) 그리고 현재 가장 리스크가 큰 조항 1가지를 알려주세요."
                : contractSubtype === "labor_relations"
                  ? "이번 노사 이슈에서 회사가 우선 달성하려는 목표는 무엇인가요? (교섭 타결, 분쟁 최소화, 운영 안정) 그리고 현재 긴급 의제 1~2가지를 알려주세요."
                  : contractSubtype === "outsourcing"
                    ? "파견·도급 구조에서 가장 걱정되는 리스크가 무엇인가요? (불법파견/사용자책임/협력사 관리) 그리고 대상 조직 규모를 알려주세요."
                    : contractSubtype === "compliance"
                      ? "점검이 필요한 영역을 골라주세요. (근로감독 대응/법정의무/4대보험/근로시간) 그리고 최근 지적받은 항목이 있으면 알려주세요."
                      : "개선이 필요한 제도 영역 1~2가지를 알려주세요. 그리고 이번 분기 내 우선순위도 함께 알려주세요."
            : "현재 조건에서 가장 바꾸고 싶은 포인트가 무엇인가요? (임금/근무시간/휴게/연차/평가) 그리고 왜 그 항목이 가장 불편한지도 알려주세요.",
        focusInfo: "핵심 파악 포인트: 개편 이유, 조직/예산 규모, 우선 개선 항목",
      };
    case "none":
      return {
        question:
          audience === "employer"
            ? "당장 개선이 필요하다고 느끼는 인사노무 주제 1가지를 골라주세요. (채용·평가·보상·징계·규정·노사관계)"
            : "최근 가장 불편했던 장면 1가지만 골라서 알려주세요. 그 상황에서 내가 가장 원했던 해결은 무엇이었나요?",
        focusInfo: "핵심 파악 포인트: 문제 1건, 기대했던 해결 방식",
      };
    case "other":
    default:
      return {
        question:
          audience === "employer"
            ? "이번 이슈에서 반드시 지키고 싶은 기준이 무엇인지 먼저 알려주세요. (비용, 속도, 조직 안정, 법적 안전성)"
            : "이번 이슈에서 가장 원하는 결과를 한 줄로 알려주세요. (빠른 해결, 금전 회수, 관계 정리, 재발 방지)",
        focusInfo: "핵심 파악 포인트: 최우선 기준 1개와 원하는 결과",
      };
  }
}

function buildThirdQuestion(category: Category, combinedText: string) {
  const insolvency = detectInsolvency(combinedText);
  const facts = extractFacts(combinedText);
  const audience = detectAudience(combinedText);
  const contractSubtype = category === "contract" ? detectContractSubtype(combinedText) : "general";
  const mainGoal = facts.wantsReinstatement
    ? "복직"
    : facts.wantsCompensation
      ? "금전 회수"
      : facts.wantsFast
        ? "신속 해결"
        : "대응 방향 확정";
  const reported = facts.reportedToAgency ? "외부 신고 진행" : "외부 신고 전";

  switch (category) {
    case "wage_arrears":
      if (insolvency) {
        return {
          question: `현재 목표(${mainGoal}) 기준으로, 대지급금 신청을 먼저 진행할지 임금체불 진정을 먼저 진행할지 선택해 주세요. 선택 이유도 한 줄로 알려주세요.`,
          focusInfo: "최종 결정 포인트: 절차 우선순위, 착수 이유, 일정",
        };
      }
      return {
        question: `현재 상태(${reported})에서 가장 먼저 맡기고 싶은 업무를 골라주세요. (증빙정리 / 진정대리 / 회사협의) 그리고 희망 착수 시점도 알려주세요.`,
        focusInfo: "최종 결정 포인트: 즉시 필요한 실행 항목, 착수 일정",
      };
    case "dismissal":
      return {
        question: `목표(복직 / 금전보상 / 분쟁 최소화) 중 우선순위를 정해 주세요. 1순위 목표를 위해 지금 당장 필요한 도움도 함께 알려주세요.`,
        focusInfo: "최종 결정 포인트: 목표 우선순위, 즉시 실행 액션",
      };
    case "harassment":
      return {
        question: `전략을 선택해 주세요. (사내 절차 우선 / 외부 절차 병행) 그리고 공인노무사에게 가장 먼저 맡기고 싶은 역할(증거정리/신고대응/협의대응)을 알려주세요.`,
        focusInfo: "최종 결정 포인트: 절차 전략, 외부 전문가 개입 범위",
      };
    case "industrial_accident":
      return {
        question: `산재 건에서 1순위 목표를 선택해 주세요. (승인 가능성 강화 / 급여 수급 속도 / 장해등급 준비) 그리고 바로 시작할 항목을 골라주세요.`,
        focusInfo: "최종 결정 포인트: 1순위 목표, 즉시 착수 항목",
      };
    case "contract":
      return {
        question:
          audience === "employer"
            ? contractSubtype === "wage_system"
              ? "개편 목적이 무엇인지 선택해 주세요. (통상임금 이슈 정비 / 평균임금 리스크 개선 / 성과보상 체계 재설계) 그리고 이번 분기 내 예산·적용 범위도 알려주세요."
              : contractSubtype === "rules"
                ? "이번 정비를 어디까지 진행할지 선택해 주세요. (문서 개정만 / 운영 프로세스 포함 / 신고·교육까지 일괄) 그리고 목표 완료 시점을 알려주세요."
                : contractSubtype === "labor_relations"
                  ? "전략 방향을 선택해 주세요. (조기 타결 중심 / 리스크 방어 중심 / 장기 협상 대비) 그리고 노무사에게 맡길 범위를 알려주세요."
                  : contractSubtype === "outsourcing"
                    ? "진단 목표를 선택해 주세요. (불법파견 판단 / 책임구조 정비 / 계약구조 재설계) 그리고 우선 점검할 사업장부터 알려주세요."
                    : contractSubtype === "compliance"
                      ? "이번 점검의 목표를 선택해 주세요. (근로감독 대비 / 법 위반 해소 / 재발 방지 체계화) 그리고 착수 희망 일정을 알려주세요."
                      : "이번 제도 정비의 목표를 선택해 주세요. (리스크 축소 / 운영 효율 / 분쟁 예방) 그리고 우선 적용 범위를 알려주세요."
            : "해결 방향을 선택해 주세요. (회사와 협의 우선 / 법적 대응 우선) 그리고 공인노무사에게 기대하는 역할을 알려주세요.",
        focusInfo: "최종 결정 포인트: 개편 목적, 예산/범위 또는 대응 경로",
      };
    case "none":
      return {
        question: `선제 점검 방식을 골라주세요. (리스크 진단 / 규정 정비 / 사건 대응 체계 설계) 그리고 언제부터 시작하면 좋은지도 알려주세요.`,
        focusInfo: "최종 결정 포인트: 점검 방식, 시작 시점",
      };
    case "other":
    default:
      return {
        question: `마지막으로, 이번 건에서 절대 놓치면 안 되는 조건 1가지를 알려주세요. (비용 / 속도 / 대외리스크 / 내부수용성 중 선택 가능)`,
        focusInfo: "최종 결정 포인트: 절대 조건 1개, 실행 우선순위",
      };
  }
}

function recommendServices(
  category: Category,
  combinedText: string,
  audience: "worker" | "employer",
  exampleSignals?: DiscoveryExampleSignals
) {
  const insolvency = detectInsolvency(combinedText);

  const defaultServices: ManagedService[] = BASE_LABOR_SERVICES.filter((s) => s.audience === audience).map((service) => {
    const steps = buildWorkflowSteps(service.name);
    return {
      ...service,
      workflowSteps: steps,
      workflowInfographic: buildWorkflowInfographicDataUrl(service.name, steps),
    };
  });

  const mergedMap = new Map<string, ManagedService>();
  for (const svc of defaultServices) mergedMap.set(`${svc.audience}:${svc.name}`, svc);
  for (const svc of readManagedServices().filter((s) => s.audience === audience)) mergedMap.set(`${svc.audience}:${svc.name}`, svc);
  const mergedServices = Array.from(mergedMap.values());

  const counseling = mergedServices.find((s) => s.name.includes("상담") || s.name.includes("자문")) || mergedServices[0];
  const wageClaim = mergedServices.find((s) => s.name === "임금체불 진정사건 대리") || {
    name: "임금체불 진정사건 대리",
    description: "미지급 임금·수당·퇴직금 증빙을 정리하고 노동청 진정 절차를 대리합니다.",
    audience: "worker",
  };
  const substitutePayment = mergedServices.find((s) => s.name === "대지급금 신청 대리") || {
    name: "대지급금 신청 대리",
    description: "도산·폐업 또는 지급불능 정황을 검토해 대지급금 신청 요건 검토와 신청 절차를 대리합니다.",
    audience: "worker",
  };

  const rankedByKeyword = mergedServices
    .map((service) => ({ service, score: scoreService(service, combinedText, exampleSignals) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.service);

  const addUnique = (arr: ManagedService[], service: ManagedService) => {
    if (!arr.some((s) => s.name === service.name)) arr.push(service);
  };

  const picks: ManagedService[] = [];

  if (audience === "worker" && category === "wage_arrears" && insolvency) {
    addUnique(picks, substitutePayment);
    addUnique(picks, wageClaim);
    if (counseling) addUnique(picks, counseling);
  } else if (audience === "worker" && category === "wage_arrears") {
    addUnique(picks, wageClaim);
    if (counseling) addUnique(picks, counseling);
    addUnique(picks, substitutePayment);
  } else {
    if (counseling) addUnique(picks, counseling);
  }

  return {
    picks,
    rankedByKeyword,
    counseling,
    wageClaim,
    substitutePayment,
    mergedServices,
  };
}

function buildFinalPicks(
  aiPicked: ManagedService[],
  rec: ReturnType<typeof recommendServices>,
  category: Category,
  audience: Audience
) {
  const finalPicked: ManagedService[] = [];
  const addUnique = (arr: ManagedService[], svc: ManagedService) => {
    if (!arr.some((s) => s.name === svc.name)) arr.push(svc);
  };

  for (const svc of aiPicked) addUnique(finalPicked, svc);

  const isWorkerWageArrears = audience === "worker" && category === "wage_arrears";
  const primaryFallback = isWorkerWageArrears ? rec.picks : rec.rankedByKeyword;
  const secondaryFallback = isWorkerWageArrears ? rec.rankedByKeyword : rec.picks;

  for (const svc of primaryFallback) {
    if (finalPicked.length >= 3) break;
    addUnique(finalPicked, svc);
  }
  for (const svc of secondaryFallback) {
    if (finalPicked.length >= 3) break;
    addUnique(finalPicked, svc);
  }

  return finalPicked;
}

function toServiceCards(services: ManagedService[]) {
  return services.slice(0, 3).map((service) => ({
    name: service.name,
    description: service.description,
    workflowSteps: service.workflowSteps && service.workflowSteps.length > 0 ? service.workflowSteps : buildAutoWorkflow(service.name),
    workflowInfographic:
      service.workflowInfographic ||
      buildWorkflowInfographicDataUrl(
        service.name,
        service.workflowSteps && service.workflowSteps.length > 0 ? service.workflowSteps : buildAutoWorkflow(service.name)
      ),
  }));
}

function buildSummary(situation: string, answers: string[], category: Category) {
  const lines = [`초기 상황: ${situation}`];
  if (answers[0]) lines.push(`2단계 응답: ${answers[0]}`);
  if (answers[1]) lines.push(`3단계 응답: ${answers[1]}`);
  lines.push(`분류 키워드: ${category}`);
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const situation = body.situation?.trim();
    const answers = Array.isArray(body.answers) ? body.answers.map((v) => String(v ?? "").trim()).filter(Boolean) : [];
    const round = Number(body.round || 1);

    if (!situation) {
      return NextResponse.json({ error: "Missing situation" }, { status: 400 });
    }

    const combinedText = [situation, ...answers].join(" ");
    const exampleSignals = inferByExamples(combinedText);
    const audience = detectAudience(combinedText, exampleSignals);
    let category = detectCategory(combinedText, exampleSignals);
    const normalizedCombined = normalize(combinedText);
    if (
      audience === "employer" &&
      category === "wage_arrears" &&
      countMatches(normalizedCombined, ["근로감독", "취업규칙", "인사규정", "파견", "도급", "단체교섭", "단체협약"]) > 0
    ) {
      category = "contract";
    }

    let payload: DiscoveryResponse;

    if (round === 1) {
      const second = buildSecondQuestion(category, combinedText);
      const rec = recommendServices(category, combinedText, audience, exampleSignals);
      const aiPickedNames = await rankServicesWithAI(rec.mergedServices, combinedText, audience);
      const aiPicked = aiPickedNames
        .map((name) => rec.mergedServices.find((s) => s.name === name))
        .filter((s): s is ManagedService => Boolean(s));
      const finalPicked = buildFinalPicks(aiPicked, rec, category, audience);
      const quickServices = toServiceCards(finalPicked).slice(0, 2);
      payload = {
        stage: "ask",
        keyword: getKeywordLabel(category),
        question: second.question,
        focusInfo: second.focusInfo,
        quickServices,
        round: 2,
      };
    } else if (round === 2) {
      const third = buildThirdQuestion(category, combinedText);
      const rec = recommendServices(category, combinedText, audience, exampleSignals);
      const aiPickedNames = await rankServicesWithAI(rec.mergedServices, combinedText, audience);
      const aiPicked = aiPickedNames
        .map((name) => rec.mergedServices.find((s) => s.name === name))
        .filter((s): s is ManagedService => Boolean(s));
      const finalPicked = buildFinalPicks(aiPicked, rec, category, audience);
      const quickServices = toServiceCards(finalPicked).slice(0, 2);
      payload = {
        stage: "ask",
        keyword: getKeywordLabel(category),
        question: third.question,
        focusInfo: third.focusInfo,
        quickServices,
        round: 3,
      };
    } else {
      const rec = recommendServices(category, combinedText, audience, exampleSignals);
      const aiPickedNames = await rankServicesWithAI(rec.mergedServices, combinedText, audience);
      const aiPicked = aiPickedNames
        .map((name) => rec.mergedServices.find((s) => s.name === name))
        .filter((s): s is ManagedService => Boolean(s));
      const finalPicked = buildFinalPicks(aiPicked, rec, category, audience);

      payload = {
        stage: "finalize",
        recommendedServices: toServiceCards(finalPicked),
        intakeSummary: buildSummary(situation, answers, category),
      };
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process discovery flow" }, { status: 500 });
  }
}
