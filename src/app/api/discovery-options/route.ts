import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { buildWorkflowInfographicDataUrl, buildWorkflowSteps } from "@/lib/workflowInfographic";
import { BASE_LABOR_SERVICES } from "@/lib/laborServicesCatalog";
import { getOpenAI } from "@/lib/openai";

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
  contract: ["근로계약", "근로조건", "연장근로", "휴게", "연차", "근무표", "시프트", "근무시간", "4대보험"],
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

function includesAny(text: string, patterns: string[]) {
  return patterns.some((p) => text.includes(p));
}

function normalize(text: string) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function scoreCategory(text: string, keywords: string[]) {
  return keywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
}

function detectCategory(text: string): Category {
  const normalized = normalize(text);

  if (!normalized || includesAny(normalized, NO_ISSUE_PATTERNS)) {
    return "none";
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

function scoreService(service: ManagedService, text: string) {
  const normalized = normalize(text);
  const keywords = (service.keywords && service.keywords.length > 0 ? service.keywords : inferKeywords(service)).map(normalize);
  return keywords.reduce((acc, keyword) => acc + (keyword && normalized.includes(keyword) ? 1 : 0), 0);
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

function detectAudience(text: string): Audience {
  const normalized = normalize(text);
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

function buildSecondQuestion(category: Category, combinedText: string) {
  const audience = detectAudience(combinedText);

  switch (category) {
    case "wage_arrears":
      return {
        question:
          audience === "employer"
            ? "임금 미지급 항목(기본급/수당/퇴직금), 발생 기간, 내부 시정 조치 여부를 알려주세요."
            : "미지급 항목(기본급/수당/퇴직금)별 금액과 지급일, 회사에 지급 요청한 방식(구두/문자/메일)을 알려주세요.",
        focusInfo: "AI가 확인하려는 정보: 미지급 항목·금액·기간, 회사에 지급 요청한 기록(문자/메일/녹취 등)",
      };
    case "dismissal":
      return {
        question:
          audience === "employer"
            ? "예정된 조치(해고/징계/권고사직), 조치 사유, 사전통지·소명절차 진행 여부를 알려주세요."
            : "회사 조치가 해고·징계·권고사직 중 무엇인지, 통보 시점/방식(구두·서면), 현재 근무상태를 알려주세요.",
        focusInfo: "AI가 확인하려는 정보: 회사 조치 내용, 통보 시점, 서면 통지 수령 여부",
      };
    case "harassment":
      return {
        question:
          audience === "employer"
            ? "신고된 행위의 유형, 발생 시점, 조사 진행 단계, 증빙 확보 현황을 알려주세요."
            : "가장 심각했던 사건 1건 기준으로, 행위 내용, 반복 횟수, 증빙 보유 여부를 알려주세요.",
        focusInfo: "AI가 확인하려는 정보: 반복된 행동 유형, 발생 시점, 사내 신고 여부",
      };
    case "industrial_accident":
      return {
        question:
          audience === "employer"
            ? "사고 발생 시점, 재해 유형, 초동조치 및 보고 체계 이행 여부를 알려주세요."
            : "사고(또는 증상) 발생 시점, 진단명, 회사 보고 여부, 현재 치료 상태를 알려주세요.",
        focusInfo: "AI가 확인하려는 정보: 사고·증상 발생 시점, 진단명, 회사 보고 여부, 치료 상태",
      };
    case "contract":
      return {
        question:
          audience === "employer"
            ? "계약서·취업규칙과 실제 운영이 다른 항목 1~2개와 개선 계획 여부를 알려주세요."
            : "계약서 기준 조건과 실제 운영이 다른 핵심 항목 1~2개를 적어주세요.",
        focusInfo: "AI가 확인하려는 정보: 가장 문제인 조건 1개, 계약 내용과 실제 운영(임금·시간·휴게·연차) 비교",
      };
    case "none":
      return {
        question:
          audience === "employer"
            ? "최근 2주 내 리스크가 컸던 인사노무 상황 1건을 시간순으로 적어주세요."
            : "최근 2주 내 가장 불편했던 상황 1건을 시간순으로 적어주세요.",
        focusInfo: "AI가 확인하려는 정보: 최근 2주 내 불편/불안 장면 1건(누가, 언제, 무엇을 했는지)",
      };
    case "other":
    default:
      return {
        question:
          audience === "employer"
            ? "최근 사건을 시간순 2~3문장으로 정리해 주세요."
            : "최근 사건을 시간순 2~3문장으로 정리해 주세요.",
        focusInfo: "AI가 확인하려는 정보: 최근 사건을 시점 순서대로 2~3문장",
      };
  }
}

function buildThirdQuestion(category: Category, combinedText: string) {
  const insolvency = detectInsolvency(combinedText);
  const facts = extractFacts(combinedText);
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
          question: `현재 목표(${mainGoal}), 상태(${reported}) 기준으로 대지급금 중심 진행과 임금체불 진정 중심 진행 중 우선순위를 선택해 주세요.`,
          focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 보유 증빙 수준",
        };
      }
      return {
        question: `현재 목표(${mainGoal}), 상태(${reported}) 기준으로 공인노무사에게 먼저 맡길 단계(증빙정리/진정대리/협의대응)를 선택해 주세요.`,
        focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 보유 증빙 수준",
      };
    case "dismissal":
      return {
        question: `목표(복직/합의·금전보상)와 상태(${reported})를 기준으로 우선 요청할 도움을 선택해 주세요.`,
        focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 당장 필요한 액션",
      };
    case "harassment":
      return {
        question: `사내 절차 우선과 외부 절차 병행 중 우선전략을 선택하고, 공인노무사에게 맡길 대응을 알려주세요.`,
        focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 당장 필요한 액션",
      };
    case "industrial_accident":
      return {
        question: `산재 인정 가능성을 높이기 위해 필요한 지원(자료정리/신청대리/의견서)을 우선순위로 알려주세요.`,
        focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 당장 필요한 액션",
      };
    case "contract":
      return {
        question: `회사 협의 우선과 법적 절차 우선 중 방향을 선택하고, 공인노무사 개입 범위를 알려주세요.`,
        focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 당장 필요한 액션",
      };
    case "none":
      return {
        question: `분쟁 예방 점검(리스크 진단/규정 점검/사건 대응 설계) 중 원하는 방식을 선택해 주세요.`,
        focusInfo: "AI가 확인하려는 정보: 선제 점검 상담 여부, 제안서 요청 여부, 진행 희망 일정",
      };
    case "other":
    default:
      return {
        question: `핵심 사실 정리와 절차 선택 중 우선 지원이 필요한 항목을 알려주세요.`,
        focusInfo: "AI가 확인하려는 정보: 원하는 지원 형태(상담 / 제안서), 진행 희망 일정, 당장 필요한 액션",
      };
  }
}

function recommendServices(category: Category, combinedText: string, audience: "worker" | "employer") {
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
    .map((service) => ({ service, score: scoreService(service, combinedText) }))
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
    const audience = detectAudience(combinedText);
    const category = detectCategory(combinedText);

    let payload: DiscoveryResponse;

    if (round === 1) {
      const second = buildSecondQuestion(category, combinedText);
      const rec = recommendServices(category, combinedText, audience);
      const aiPickedNames = await rankServicesWithAI(rec.mergedServices, combinedText, audience);
      const aiPicked = aiPickedNames
        .map((name) => rec.mergedServices.find((s) => s.name === name))
        .filter((s): s is ManagedService => Boolean(s));
      const finalPicked: ManagedService[] = [];
      const addUnique = (arr: ManagedService[], svc: ManagedService) => {
        if (!arr.some((s) => s.name === svc.name)) arr.push(svc);
      };
      for (const svc of aiPicked) addUnique(finalPicked, svc);
      for (const svc of rec.picks) {
        if (finalPicked.length >= 3) break;
        addUnique(finalPicked, svc);
      }
      for (const svc of rec.rankedByKeyword) {
        if (finalPicked.length >= 3) break;
        addUnique(finalPicked, svc);
      }
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
      const rec = recommendServices(category, combinedText, audience);
      const aiPickedNames = await rankServicesWithAI(rec.mergedServices, combinedText, audience);
      const aiPicked = aiPickedNames
        .map((name) => rec.mergedServices.find((s) => s.name === name))
        .filter((s): s is ManagedService => Boolean(s));
      const finalPicked: ManagedService[] = [];
      const addUnique = (arr: ManagedService[], svc: ManagedService) => {
        if (!arr.some((s) => s.name === svc.name)) arr.push(svc);
      };
      for (const svc of aiPicked) addUnique(finalPicked, svc);
      for (const svc of rec.picks) {
        if (finalPicked.length >= 3) break;
        addUnique(finalPicked, svc);
      }
      for (const svc of rec.rankedByKeyword) {
        if (finalPicked.length >= 3) break;
        addUnique(finalPicked, svc);
      }
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
      const rec = recommendServices(category, combinedText, audience);
      const aiPickedNames = await rankServicesWithAI(rec.mergedServices, combinedText, audience);
      const aiPicked = aiPickedNames
        .map((name) => rec.mergedServices.find((s) => s.name === name))
        .filter((s): s is ManagedService => Boolean(s));
      const finalPicked: ManagedService[] = [];
      const addUnique = (arr: ManagedService[], svc: ManagedService) => {
        if (!arr.some((s) => s.name === svc.name)) arr.push(svc);
      };
      for (const svc of aiPicked) addUnique(finalPicked, svc);
      for (const svc of rec.picks) {
        if (finalPicked.length >= 3) break;
        addUnique(finalPicked, svc);
      }
      for (const svc of rec.rankedByKeyword) {
        if (finalPicked.length >= 3) break;
        addUnique(finalPicked, svc);
      }

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
