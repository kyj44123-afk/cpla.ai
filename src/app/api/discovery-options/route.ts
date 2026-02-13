import { NextResponse } from "next/server";

type Body = {
  situation: string;
  answers?: string[];
  round: number;
};

type Category = "none" | "wage_arrears" | "dismissal" | "harassment" | "industrial_accident" | "contract" | "other";

type DiscoveryResponse =
  | {
      stage: "ask";
      question: string;
      round: number;
    }
  | {
      stage: "finalize";
      recommendedService: string;
      recommendationReason: string;
      intakeSummary: string;
    };

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

function scoreCategory(text: string, keywords: string[]) {
  return keywords.reduce((acc, keyword) => acc + (text.includes(keyword) ? 1 : 0), 0);
}

function detectCategory(text: string): Category {
  const normalized = text.replace(/\s+/g, "").toLowerCase();

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
  const normalized = text.replace(/\s+/g, "");
  return includesAny(normalized, ["폐업", "도산", "파산", "회생", "청산", "연락두절"]);
}

function buildSecondQuestion(category: Category) {
  switch (category) {
    case "wage_arrears":
      return "핵심 키워드는 임금체불입니다. 임금체불은 시간이 지날수록 증빙 정리와 회수 전략이 더 중요해지는 이슈입니다. 미지급 항목·금액·기간, 그리고 회사에 지급 요청한 기록이 있는지 구체적으로 적어주실 수 있나요?";
    case "dismissal":
      return "핵심 키워드는 부당해고·징계입니다. 부당해고·징계 이슈는 초기 대응 방향에 따라 결과가 크게 달라질 수 있습니다. 회사가 통보한 조치 내용·통보 시점·서면 통지 수령 여부를 정확히 적어주실 수 있나요?";
    case "harassment":
      return "핵심 키워드는 직장 내 괴롭힘입니다. 직장 내 괴롭힘은 반복 정황과 증거 확보가 핵심이라 초기에 구조화가 필요합니다. 반복된 행동 유형·발생 시점·사내 신고 여부를 가능한 사실 중심으로 적어주실 수 있나요?";
    case "industrial_accident":
      return "핵심 키워드는 산업재해입니다. 산업재해는 업무관련성 입증 포인트를 조기에 잡는 것이 매우 중요합니다. 사고·증상 발생 시점, 진단명, 회사 보고 여부와 현재 치료 상태를 적어주실 수 있나요?";
    case "contract":
      return "핵심 키워드는 근로조건·근무체계입니다. 근로조건 이슈는 계약과 실제 운영의 차이를 특정하면 해결 경로가 빨라집니다. 현재 가장 문제인 조건 1개와 실제 운영 방식(임금·시간·휴게·연차)을 비교해서 적어주실 수 있나요?";
    case "none":
      return "지금은 문제를 명확히 이름 붙이기 전 단계로 보이지만, 이 시점에 정확히 짚으면 분쟁을 미리 막을 수 있습니다. 최근 2주 안에 불편하거나 불안했던 장면 1가지를 시간순으로 적어주실 수 있나요?";
    case "other":
    default:
      return "핵심 키워드는 근로관계 분쟁 가능성입니다. 사실관계를 먼저 구조화하면 대응 속도와 정확도가 크게 올라갑니다. 최근 사건을 시점 순서대로 2~3문장으로 적어주실 수 있나요?";
  }
}

function buildThirdQuestion(category: Category, combinedText: string) {
  const insolvency = detectInsolvency(combinedText);

  switch (category) {
    case "wage_arrears":
      if (insolvency) {
        return "현재 목적을 충족하려면 임금채권 증빙을 먼저 정리하고, 도산·폐업 여부에 따른 대지급금 요건 검토 후 신청 전략을 확정하는 절차가 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
      }
      return "현재 목적을 충족하려면 미지급 내역·증빙을 확정하고, 사업주 지급요청과 노동청 진정 절차를 병행 설계하는 방식이 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
    case "dismissal":
      return "현재 목적을 충족하려면 회사 통보 내용과 절차 위반 여부를 신속히 확인하고, 증빙 기반으로 대응서면·구제신청 전략을 설계하는 절차가 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
    case "harassment":
      return "현재 목적을 충족하려면 발생 사실을 시점별로 정리하고 증거를 확보한 뒤, 사내 신고와 외부 절차의 우선순위를 정해 실행하는 절차가 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
    case "industrial_accident":
      return "현재 목적을 충족하려면 업무관련성 입증자료를 먼저 확보하고, 치료 경과·소득손실 자료를 바탕으로 산재 절차를 설계하는 방식이 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
    case "contract":
      return "현재 목적을 충족하려면 계약서와 실제 운영내역의 차이를 수치와 사실로 정리하고, 회사 협의 또는 법적 절차 중 실행 경로를 확정하는 방식이 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
    case "none":
      return "현재 목적을 충족하려면 먼저 사실관계 진단으로 잠재 리스크를 확인하고, 문제가 드러나면 즉시 대응 절차를 설계하는 방식이 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 선제 점검 상담을 원하시나요, 아니면 제안서부터 받아보시겠어요?";
    case "other":
    default:
      return "현재 목적을 충족하려면 핵심 사실과 증빙 가능 자료를 먼저 구조화하고, 행정절차와 협의절차 중 최적 경로를 빠르게 확정하는 방식이 효과적입니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요? 상담으로 시작하시겠어요, 아니면 바로 제안서 작성을 원하시나요?";
  }
}

function recommendService(category: Category, combinedText: string) {
  const insolvency = detectInsolvency(combinedText);

  if (category === "wage_arrears" && insolvency) {
    return {
      service: "대지급금 신청 대리",
      reason: "도산·폐업 정황과 임금 미지급 이슈가 함께 보여 대지급금 요건 검토와 신청 대리가 우선입니다.",
    };
  }

  if (category === "wage_arrears") {
    return {
      service: "임금체불 진정사건 대리",
      reason: "미지급 임금 정황이 중심이어서 진정 절차 설계와 증빙 정리가 직접적인 해결 경로입니다.",
    };
  }

  return {
    service: "전문 공인노무사 상담",
    reason: "핵심 이슈의 사실관계와 절차 선택이 먼저 필요해 초기 전략 상담이 가장 적합합니다.",
  };
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
    const category = detectCategory(combinedText);

    let payload: DiscoveryResponse;

    if (round === 1) {
      payload = {
        stage: "ask",
        question: buildSecondQuestion(category),
        round: 2,
      };
    } else if (round === 2) {
      payload = {
        stage: "ask",
        question: buildThirdQuestion(category, combinedText),
        round: 3,
      };
    } else {
      const recommendation = recommendService(category, combinedText);
      payload = {
        stage: "finalize",
        recommendedService: recommendation.service,
        recommendationReason: recommendation.reason,
        intakeSummary: buildSummary(situation, answers, category),
      };
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process discovery flow" }, { status: 500 });
  }
}
