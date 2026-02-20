export type DiagnosisTier = "excellent" | "strong" | "planning" | "outsourcing" | "urgent";

export type ServiceRecommendation = {
  id: string;
  title: string;
  summary: string;
  image: string;
  href: string;
};

export const ENTERPRISE_QUESTIONS = [
  "신규 직원이 근무를 개시할 때에 적법한 근로계약서가 작성된 상태인가요?",
  "근무시간이 1주 52시간을 초과하는 경우가 단 1명, 단 1주도 없었나요? 있었다면, 선택적근로시간제, 재량근로시간제 등 유연근무제도가 적용되고 있었나요?",
  "현행 취업규칙이 근로기준법에 따른 필수 조항들을 모두 반영하고 있나요?",
  "법정 통상임금, 평균임금을 정확하게 계산해서 임금 및 퇴직금을 지급하고 있나요?",
  "사업장에 상주하고 있는 프리랜서(3.3) 또는 하도급업체 직원이 전혀 없나요?",
  "직장 내 성희롱, 직장 내 괴롭힘 사건 발생 시 대응 프로세스를 갖고 있나요?",
  "기간제근로자, 단시간근로자, 일용직근로자를 위한 별도의 인사체계를 갖추고 있나요?",
  "인사담당자가 인사 업무만 전담하고 있나요?",
  "인사팀 또는 인사담당자가 신규 제도설계, 현행 인사체계에 대한 최신법령 반영 등의 인사기획 기능을 담당, 수행하고 있나요?",
  "인사체계에 대한 자체 점검 프로세스를 갖추고 있거나, 외부의 전문가에게 정기적으로 점검을 받고 있나요?",
] as const;

const SERVICE_LIBRARY: Record<string, ServiceRecommendation> = {
  certification: {
    id: "certification",
    title: "인사제도 인증 패키지",
    summary: "고도화된 인사체계를 외부 인증 관점으로 점검하고 브랜드 신뢰를 강화합니다.",
    image: "/diagnosis/services/certification.svg",
    href: "/counseling",
  },
  advanced: {
    id: "advanced",
    title: "프리미엄 리스크 클로징 자문",
    summary: "남아있는 취약 구간을 법률/운영 관점에서 빠르게 보완합니다.",
    image: "/diagnosis/services/advanced.svg",
    href: "/counseling",
  },
  planning: {
    id: "planning",
    title: "HR 기획 고도화 프로그램",
    summary: "제도 설계와 데이터 기반 운영을 결합해 중장기 인사기획 기능을 강화합니다.",
    image: "/diagnosis/services/planning.svg",
    href: "/enterprise-diagnosis",
  },
  outsourcing: {
    id: "outsourcing",
    title: "인사업무 아웃소싱 + 법률자문",
    summary: "운영부담이 큰 인사업무를 분리하고 핵심 의사결정에 집중하도록 돕습니다.",
    image: "/diagnosis/services/outsourcing.svg",
    href: "/counseling",
  },
  urgent: {
    id: "urgent",
    title: "긴급 노무 리스크 구조개선",
    summary: "분쟁 가능성이 큰 영역부터 즉시 진단하고 원스톱 개선안을 실행합니다.",
    image: "/diagnosis/services/urgent.svg",
    href: "/counseling",
  },
};

const SCORE_SERVICE_KEY: Record<number, keyof typeof SERVICE_LIBRARY> = {
  0: "urgent",
  1: "urgent",
  2: "urgent",
  3: "urgent",
  4: "urgent",
  5: "outsourcing",
  6: "planning",
  7: "planning",
  8: "advanced",
  9: "advanced",
  10: "certification",
};

export function encodeAnswers(answers: boolean[]) {
  return answers.map((value) => (value ? "1" : "0")).join("");
}

export function decodeAnswers(bits: string) {
  const normalized = bits.trim();
  if (normalized.length !== ENTERPRISE_QUESTIONS.length) return null;
  if (!/^[01]+$/.test(normalized)) return null;
  return normalized.split("").map((bit) => bit === "1");
}

export function getDiagnosisTier(answers: boolean[]): DiagnosisTier {
  const yesCount = answers.filter(Boolean).length;
  const q8Yes = answers[7];
  const q9Yes = answers[8];

  if (yesCount === 10) return "excellent";
  if (yesCount >= 8 && yesCount <= 9) return "strong";
  if (yesCount >= 5 && yesCount <= 7 && q9Yes) return "planning";
  if (yesCount >= 5 && yesCount <= 7 && (!q8Yes || !q9Yes)) return "outsourcing";
  return "urgent";
}

export function getDiagnosisMessage(tier: DiagnosisTier) {
  if (tier === "excellent") {
    return "훌륭합니다! 우리 회사의 인사제도를 널리 알릴 수 있는 '인증'을 받는 건 어떨까요?";
  }
  if (tier === "strong") {
    return "우수합니다! 다만 지금 놓치고 있는 사항들을 전문가와 함께 개선해보면 어떨까요?";
  }
  if (tier === "planning") {
    return "추가적인 인사기획이 필요합니다. 전문가의 도움을 받아 올해 부족한 부분을 보완해보면 어떨까요?";
  }
  if (tier === "outsourcing") {
    return "보통 수준입니다. 현재 존재하는 리스크를 진단받거나, 인사담당자가 기획 업무에 집중할 수 있도록 인사업무 일부를 아웃소싱하는 건 어떨까요?";
  }
  return "전문가의 도움이 절실한 상황입니다. 정확하게 진단 받고 원스톱 솔루션을 받으세요.";
}

export function getRecommendations(answers: boolean[]) {
  const yesCount = answers.filter(Boolean).length;
  const tier = getDiagnosisTier(answers);
  const primary = SERVICE_LIBRARY[SCORE_SERVICE_KEY[yesCount]];
  const companion =
    tier === "excellent"
      ? SERVICE_LIBRARY.advanced
      : tier === "strong"
        ? SERVICE_LIBRARY.planning
        : tier === "planning"
          ? SERVICE_LIBRARY.advanced
          : tier === "outsourcing"
            ? SERVICE_LIBRARY.planning
            : SERVICE_LIBRARY.outsourcing;
  return [primary, companion];
}

export function getScoreTrackLabel(yesCount: number) {
  const key = SCORE_SERVICE_KEY[yesCount];
  return SERVICE_LIBRARY[key].title;
}
