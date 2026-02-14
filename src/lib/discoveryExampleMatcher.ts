import learnedExamplesRaw from "./discoveryLearnedExamples.json";
import mismatchExamplesRaw from "./discoveryMismatchExamples.json";

export type DiscoveryAudience = "worker" | "employer";
export type DiscoveryCategory = "none" | "wage_arrears" | "dismissal" | "harassment" | "industrial_accident" | "contract" | "other";

type DiscoveryExample = {
  text: string;
  audience: DiscoveryAudience;
  category: DiscoveryCategory;
  services: string[];
};

export type DiscoveryExampleSignals = {
  confidence: number;
  audience?: DiscoveryAudience;
  category?: DiscoveryCategory;
  serviceScores: Record<string, number>;
};

type LearnedDiscoveryExample = {
  text?: string;
  audience?: DiscoveryAudience;
  category?: DiscoveryCategory;
  services?: string[];
  count?: number;
};

const LEGACY_SERVICE_NAME_MAP: Record<string, string> = {
  "직장 내 괴롭힘 신고 대응": "직장 내 괴롭힘 신고 지원",
  "직장 내 성희롱 대응": "직장 내 성희롱 신고 지원",
};

function canonicalizeServiceName(name: string) {
  const trimmed = String(name || "").trim();
  return LEGACY_SERVICE_NAME_MAP[trimmed] || trimmed;
}

function canonicalizeServices(services: string[]) {
  return Array.from(new Set(services.map((service) => canonicalizeServiceName(service)).filter(Boolean)));
}

const EXAMPLES: DiscoveryExample[] = [
  { text: "월급이 두 달째 밀렸고 대표가 계속 다음 달에 준다고만 합니다.", audience: "worker", category: "wage_arrears", services: ["임금체불 진정사건 대리", "전문 공인노무사 상담"] },
  { text: "퇴사했는데 퇴직금을 못 받아서 청구 절차를 진행하고 싶습니다.", audience: "worker", category: "wage_arrears", services: ["퇴직금 청구 대리", "임금체불 진정사건 대리"] },
  { text: "폐업한 회사에서 임금이 밀렸는데 체당금 신청 가능한지 궁금합니다.", audience: "worker", category: "wage_arrears", services: ["대지급금 신청 대리", "임금체불 진정사건 대리"] },
  { text: "임금명세서를 한 번도 받은 적이 없어서 대응하고 싶습니다.", audience: "worker", category: "wage_arrears", services: ["임금명세서 위반 대응", "전문 공인노무사 상담"] },
  { text: "최저임금보다 낮은 시급을 받고 있는데 신고 전에 점검받고 싶습니다.", audience: "worker", category: "wage_arrears", services: ["최저임금 위반 대응", "전문 공인노무사 상담"] },
  { text: "연장근로 수당이 누락된 것 같아 계산과 청구를 맡기고 싶습니다.", audience: "worker", category: "wage_arrears", services: ["연장·야간·휴일수당 청구", "임금체불 진정사건 대리"] },
  { text: "야간근무를 오래 했는데 가산수당을 못 받았습니다.", audience: "worker", category: "wage_arrears", services: ["연장·야간·휴일수당 청구", "전문 공인노무사 상담"] },
  { text: "휴일에 일한 수당이 빠져 있어서 회사와 분쟁 중입니다.", audience: "worker", category: "wage_arrears", services: ["연장·야간·휴일수당 청구", "임금체불 진정사건 대리"] },
  { text: "연차 미사용수당을 못 받았는데 근거 정리부터 필요합니다.", audience: "worker", category: "wage_arrears", services: ["연차휴가 미사용수당 청구", "전문 공인노무사 상담"] },
  { text: "포괄임금제라면서 수당을 안 주는데 적법한지 확인하고 싶습니다.", audience: "worker", category: "wage_arrears", services: ["포괄임금제 적법성 점검", "통상임금 재산정 자문"] },
  { text: "정기상여금을 통상임금에 포함해야 하는지 자문이 필요합니다.", audience: "worker", category: "wage_arrears", services: ["통상임금 재산정 자문", "전문 공인노무사 상담"] },
  { text: "근로시간 기록과 실제가 달라서 임금 계산이 맞는지 봐주세요.", audience: "worker", category: "contract", services: ["근로시간 위반 진단", "연장·야간·휴일수당 청구"] },
  { text: "갑자기 해고 통보를 받았고 서면통지도 없었습니다.", audience: "worker", category: "dismissal", services: ["부당해고 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "권고사직을 강요받고 있는데 거부하면 불이익 준다고 합니다.", audience: "worker", category: "dismissal", services: ["권고사직·사직강요 대응", "부당해고 구제신청 대리"] },
  { text: "정직 처분을 받았는데 절차가 이상해서 다투고 싶습니다.", audience: "worker", category: "dismissal", services: ["부당징계 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "감봉 징계가 과도한 것 같은데 구제신청 가능한가요.", audience: "worker", category: "dismissal", services: ["부당징계 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "원치 않는 타부서 전보 명령을 받았고 사유도 불명확합니다.", audience: "worker", category: "dismissal", services: ["부당전직·전보 대응", "전문 공인노무사 상담"] },
  { text: "전직 발령이 사실상 퇴사 압박이라 대응이 필요합니다.", audience: "worker", category: "dismissal", services: ["부당전직·전보 대응", "권고사직·사직강요 대응"] },
  { text: "징계위원회 없이 바로 징계 통보를 받아 억울합니다.", audience: "worker", category: "dismissal", services: ["부당징계 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "해고사유가 모호하고 소명 기회도 못 받았습니다.", audience: "worker", category: "dismissal", services: ["부당해고 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "상사가 공개적으로 모욕하고 반복적으로 따돌립니다.", audience: "worker", category: "harassment", services: ["직장 내 괴롭힘 신고 지원", "전문 공인노무사 상담"] },
  { text: "팀장이 폭언을 계속해서 사내 신고와 외부 대응을 고민 중입니다.", audience: "worker", category: "harassment", services: ["직장 내 괴롭힘 신고 지원", "전문 공인노무사 상담"] },
  { text: "직장 내 왕따로 정신과 치료까지 받는 중입니다.", audience: "worker", category: "harassment", services: ["직장 내 괴롭힘 신고 지원", "산재보상 신청 대리"] },
  { text: "회식 자리에서 성희롱을 당했고 회사가 제대로 조사하지 않습니다.", audience: "worker", category: "harassment", services: ["직장 내 성희롱 신고 지원", "전문 공인노무사 상담"] },
  { text: "성적 농담과 신체접촉이 반복되어 증거를 모으고 있습니다.", audience: "worker", category: "harassment", services: ["직장 내 성희롱 신고 지원", "직장 내 괴롭힘 신고 지원"] },
  { text: "괴롭힘 신고했는데 오히려 불이익 인사 조치를 받았습니다.", audience: "worker", category: "harassment", services: ["직장 내 괴롭힘 신고 지원", "부당전직·전보 대응"] },
  { text: "업무 중 사고로 다쳤는데 산재 신청 절차를 모르겠습니다.", audience: "worker", category: "industrial_accident", services: ["산재보상 신청 대리", "전문 공인노무사 상담"] },
  { text: "출근길 교통사고가 났는데 산재 인정이 가능한가요.", audience: "worker", category: "industrial_accident", services: ["산재보상 신청 대리", "전문 공인노무사 상담"] },
  { text: "과로로 디스크가 심해졌는데 업무상질병 입증이 필요합니다.", audience: "worker", category: "industrial_accident", services: ["업무상질병 산재 인정 대응", "산재보상 신청 대리"] },
  { text: "반복 작업으로 근골격계 질환 진단을 받았습니다.", audience: "worker", category: "industrial_accident", services: ["업무상질병 산재 인정 대응", "산재보상 신청 대리"] },
  { text: "산재 치료가 끝났는데 장해급여 신청을 도와주세요.", audience: "worker", category: "industrial_accident", services: ["장해급여 청구 지원", "산재보상 신청 대리"] },
  { text: "유족급여와 장의비를 동시에 청구하려는데 절차가 복잡합니다.", audience: "worker", category: "industrial_accident", services: ["유족급여·장의비 청구 지원", "산재보상 신청 대리"] },
  { text: "회사가 사고를 은폐하려 해서 초동 대응부터 필요합니다.", audience: "worker", category: "industrial_accident", services: ["산재보상 신청 대리", "전문 공인노무사 상담"] },
  { text: "실업급여 이직확인서가 사실과 다르게 기재됐습니다.", audience: "worker", category: "contract", services: ["실업급여 이직확인서 대응", "전문 공인노무사 상담"] },
  { text: "부정수급 조사 통지를 받아 소명자료 준비가 필요합니다.", audience: "worker", category: "contract", services: ["부정수급 조사 대응", "전문 공인노무사 상담"] },
  { text: "근로계약서와 실제 근무조건이 달라서 분쟁이 생겼습니다.", audience: "worker", category: "contract", services: ["전문 공인노무사 상담", "근로시간 위반 진단"] },
  { text: "교대제 근무표가 계속 바뀌어 휴게시간 보장이 안 됩니다.", audience: "worker", category: "contract", services: ["근로시간 위반 진단", "전문 공인노무사 상담"] },
  { text: "회사에서 일방적으로 임금체계를 바꿨는데 불이익 같습니다.", audience: "worker", category: "contract", services: ["통상임금 재산정 자문", "전문 공인노무사 상담"] },
  { text: "수습기간 연장을 계속 요구받는데 법적으로 가능한지 궁금합니다.", audience: "worker", category: "contract", services: ["전문 공인노무사 상담", "근로시간 위반 진단"] },
  { text: "부당한 인사평가로 승진이 누락됐고 이의제기하고 싶습니다.", audience: "worker", category: "other", services: ["전문 공인노무사 상담"] },
  { text: "성과급 기준이 불투명해서 지급이 들쑥날쑥합니다.", audience: "worker", category: "contract", services: ["통상임금 재산정 자문", "전문 공인노무사 상담"] },
  { text: "노동청에 이미 진정 넣었는데 다음 단계가 막막합니다.", audience: "worker", category: "wage_arrears", services: ["임금체불 진정사건 대리", "전문 공인노무사 상담"] },
  { text: "대표가 연락두절이라 임금 회수 방법을 빨리 찾고 싶습니다.", audience: "worker", category: "wage_arrears", services: ["대지급금 신청 대리", "임금체불 진정사건 대리"] },
  { text: "카톡으로 사직 처리됐는데 정식 절차가 아닌 것 같습니다.", audience: "worker", category: "dismissal", services: ["권고사직·사직강요 대응", "부당해고 구제신청 대리"] },
  { text: "병가 중 해고를 통보받아 노동위 구제신청을 준비 중입니다.", audience: "worker", category: "dismissal", services: ["부당해고 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "계약직인데 계약만료를 빌미로 갑자기 내보내려 합니다.", audience: "worker", category: "dismissal", services: ["부당해고 구제신청 대리", "권고사직·사직강요 대응"] },
  { text: "상습 폭언 때문에 퇴사했는데 괴롭힘 입증이 가능할까요.", audience: "worker", category: "harassment", services: ["직장 내 괴롭힘 신고 지원", "전문 공인노무사 상담"] },
  { text: "성희롱 신고 후 인사상 불이익을 받아 추가 대응이 필요합니다.", audience: "worker", category: "harassment", services: ["직장 내 성희롱 신고 지원", "부당전직·전보 대응"] },
  { text: "업무 중 넘어져 골절됐고 요양급여 신청을 도와주세요.", audience: "worker", category: "industrial_accident", services: ["산재보상 신청 대리", "장해급여 청구 지원"] },
  { text: "장시간 운전 후 뇌심혈관 질환 진단을 받아 산재 문의합니다.", audience: "worker", category: "industrial_accident", services: ["업무상질병 산재 인정 대응", "산재보상 신청 대리"] },
  { text: "우리 회사 인사담당자인데 취업규칙 개정 절차를 정비해야 합니다.", audience: "employer", category: "contract", services: ["취업규칙 제·개정 자문", "사업주·인사담당 노무자문"] },
  { text: "신규 입사자 근로계약서를 표준화하고 법 위반 요소를 점검하고 싶습니다.", audience: "employer", category: "contract", services: ["근로계약서 점검·작성", "사업주·인사담당 노무자문"] },
  { text: "교대제 근무표를 새로 작성하고 싶습니다.", audience: "employer", category: "contract", services: ["교대제·근무표 설계 자문", "사업주·인사담당 노무자문"] },
  { text: "시프트 스케줄을 법정근로시간에 맞게 재설계하려고 합니다.", audience: "employer", category: "contract", services: ["교대제·근무표 설계 자문", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "교대근무 인력운영 때문에 수당이 급증해 근무표 개선이 필요합니다.", audience: "employer", category: "contract", services: ["교대제·근무표 설계 자문", "사업주·인사담당 노무자문"] },
  { text: "인사규정이 오래돼 징계와 퇴직 규정을 전면 정비하려고 합니다.", audience: "employer", category: "contract", services: ["인사규정 정비 자문", "취업규칙 제·개정 자문"] },
  { text: "임금체계 개편 프로젝트를 시작하려고 하는데 직무급 설계가 필요합니다.", audience: "employer", category: "contract", services: ["임금체계 개편 자문", "성과급·인센티브 설계 자문"] },
  { text: "성과급 제도 도입 시 법적 리스크와 설계 포인트를 알고 싶습니다.", audience: "employer", category: "contract", services: ["성과급·인센티브 설계 자문", "임금체계 개편 자문"] },
  { text: "연봉제 전환과 기존 호봉제 정합성을 검토해 주세요.", audience: "employer", category: "contract", services: ["임금체계 개편 자문", "사업주·인사담당 노무자문"] },
  { text: "평가보상 연계를 강화하려고 인사평가 제도부터 재설계하려 합니다.", audience: "employer", category: "contract", services: ["인사평가 제도 설계", "성과급·인센티브 설계 자문"] },
  { text: "징계위원회 운영 프로세스를 문서화하고 싶습니다.", audience: "employer", category: "dismissal", services: ["징계위원회 운영 자문", "인사규정 정비 자문"] },
  { text: "노동청 근로감독 예정 통지를 받아 사전 점검이 필요합니다.", audience: "employer", category: "contract", services: ["노동청 근로감독 대응", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "근로기준법 준수 상태를 전반적으로 진단받고 싶습니다.", audience: "employer", category: "contract", services: ["노동관계 법정의무 컴플라이언스 점검", "노무 진단 보고서 작성"] },
  { text: "4대보험 보수신고 오류가 많아 정정 프로세스가 필요합니다.", audience: "employer", category: "contract", services: ["4대보험 취득·상실 정정 자문", "사업주·인사담당 노무자문"] },
  { text: "노사협의회를 새로 설치해야 하는데 운영 기준이 없습니다.", audience: "employer", category: "contract", services: ["노사협의회 설치·운영 자문", "사업주·인사담당 노무자문"] },
  { text: "사내 고충처리제도를 만들어 분쟁을 줄이고 싶습니다.", audience: "employer", category: "harassment", services: ["고충처리제도 구축", "직장 내 괴롭힘 예방체계 구축"] },
  { text: "단체교섭을 앞두고 교섭 전략과 자료를 준비하고 싶습니다.", audience: "employer", category: "other", services: ["단체교섭 전략 자문", "단체협약 검토 자문"] },
  { text: "단체협약 개정안의 법적 리스크를 사전 검토해 주세요.", audience: "employer", category: "other", services: ["단체협약 검토 자문", "단체교섭 전략 자문"] },
  { text: "파업 가능성이 있어 쟁의 대응 시나리오를 마련해야 합니다.", audience: "employer", category: "other", services: ["노동쟁의 대응 자문", "직장폐쇄·쟁의 국면 대응"] },
  { text: "노조 활동 관련 부당노동행위 신고 리스크가 걱정됩니다.", audience: "employer", category: "other", services: ["부당노동행위 구제신청 지원", "사업주·인사담당 노무자문"] },
  { text: "기간제와 정규직 간 처우 차이로 차별시정 이슈가 발생했습니다.", audience: "employer", category: "contract", services: ["비정규직 차별시정 대응", "사업주·인사담당 노무자문"] },
  { text: "사내 도급 구조가 불법파견인지 진단이 필요합니다.", audience: "employer", category: "contract", services: ["파견·도급 적법성 진단", "원·하청 노무리스크 점검"] },
  { text: "원청과 협력사 인력운영에서 사용자책임 리스크를 점검하고 싶습니다.", audience: "employer", category: "contract", services: ["원·하청 노무리스크 점검", "파견·도급 적법성 진단"] },
  { text: "노사갈등이 심해져 직장폐쇄 검토 단계입니다.", audience: "employer", category: "other", services: ["직장폐쇄·쟁의 국면 대응", "노동쟁의 대응 자문"] },
  { text: "M&A 실사에서 인사노무 리스크 보고서가 필요합니다.", audience: "employer", category: "contract", services: ["기업 인사노무 실사(DD)", "HR Due Diligence 보고서 작성"] },
  { text: "투자 유치 전 HR Due Diligence를 준비하려고 합니다.", audience: "employer", category: "contract", services: ["HR Due Diligence 보고서 작성", "기업 인사노무 실사(DD)"] },
  { text: "중간관리자 대상 노동법 교육 과정을 만들고 싶습니다.", audience: "employer", category: "other", services: ["사내 교육(노동법·인사실무)", "사업주·인사담당 노무자문"] },
  { text: "직장 내 괴롭힘 예방 규정과 조사 프로토콜을 구축해야 합니다.", audience: "employer", category: "harassment", services: ["직장 내 괴롭힘 예방체계 구축", "고충처리제도 구축"] },
  { text: "성희롱 예방교육과 사건 대응 체계를 통합하고 싶습니다.", audience: "employer", category: "harassment", services: ["직장 내 성희롱 예방체계 구축", "사내 교육(노동법·인사실무)"] },
  { text: "월 단위 고문 형태로 상시 노무 자문이 필요합니다.", audience: "employer", category: "other", services: ["인사노무 정기 자문(월 고문)", "사업주·인사담당 노무자문"] },
  { text: "분기마다 현장 점검 기반 노무진단 보고서를 받고 싶습니다.", audience: "employer", category: "contract", services: ["노무 진단 보고서 작성", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "복수 사업장 취업규칙을 통합 정비하고 신고까지 진행하고 싶습니다.", audience: "employer", category: "contract", services: ["취업규칙 제·개정 자문", "인사규정 정비 자문"] },
  { text: "채용 단계 표준 근로계약서와 필수 고지 문구를 정비해야 합니다.", audience: "employer", category: "contract", services: ["근로계약서 점검·작성", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "신입 평가제도와 보상 기준을 동시에 설계하려고 합니다.", audience: "employer", category: "contract", services: ["인사평가 제도 설계", "성과급·인센티브 설계 자문"] },
  { text: "임금피크제 개편과 직무급 도입을 병행하려고 합니다.", audience: "employer", category: "contract", services: ["임금체계 개편 자문", "인사평가 제도 설계"] },
  { text: "성과급 차등 지급 기준이 분쟁 없이 작동하도록 설계해 주세요.", audience: "employer", category: "contract", services: ["성과급·인센티브 설계 자문", "인사평가 제도 설계"] },
  { text: "징계사건이 늘어 절차 정합성과 문서 템플릿이 필요합니다.", audience: "employer", category: "dismissal", services: ["징계위원회 운영 자문", "인사규정 정비 자문"] },
  { text: "고용노동부 점검 전에 임금명세서와 근로시간 운영을 선점검하고 싶습니다.", audience: "employer", category: "contract", services: ["노동청 근로감독 대응", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "사내 괴롭힘 신고가 늘어 익명 신고 채널 구축이 급합니다.", audience: "employer", category: "harassment", services: ["직장 내 괴롭힘 예방체계 구축", "고충처리제도 구축"] },
  { text: "성희롱 사건 발생 후 재발방지 체계를 전면 개편하려고 합니다.", audience: "employer", category: "harassment", services: ["직장 내 성희롱 예방체계 구축", "고충처리제도 구축"] },
  { text: "직장 내 괴롭힘 신고 접수가 들어와 즉시 사실조사가 필요합니다.", audience: "employer", category: "harassment", services: ["직장 내 괴롭힘 전문 조사", "직장 내 괴롭힘"] },
  { text: "성희롱 신고가 접수되어 조사위원회 구성과 조사보고서 작성이 필요합니다.", audience: "employer", category: "harassment", services: ["직장 내 성희롱 전문 조사", "직장 내 성희롱"] },
  { text: "징계 사안 신고 접수가 들어와 소명 포함 전문 조사를 먼저 진행하고 싶습니다.", audience: "employer", category: "dismissal", services: ["징계 사안 전문 조사", "징계위원회 운영 자문"] },
  { text: "조직문화컨설팅이 필요합니다. 팀 간 갈등이 많고 소통이 단절됐습니다.", audience: "employer", category: "contract", services: ["조직문화 컨설팅", "사업주·인사담당 노무자문"] },
  { text: "조직문화 개선 프로젝트를 시작하려고 합니다.", audience: "employer", category: "contract", services: ["조직문화 컨설팅", "사내 교육(노동법·인사실무)"] },
  { text: "직장 내 괴롭힘 이슈가 반복돼 대응 체계를 새로 만들고 싶습니다.", audience: "employer", category: "harassment", services: ["직장 내 괴롭힘", "직장 내 괴롭힘 예방체계 구축"] },
  { text: "직장 내 성희롱 사건 이후 전사 대응 체계를 정비하려고 합니다.", audience: "employer", category: "harassment", services: ["직장 내 성희롱", "직장 내 성희롱 예방체계 구축"] },
  { text: "조직 동기부여가 떨어져 성과 몰입을 높이는 제도 설계가 필요합니다.", audience: "employer", category: "contract", services: ["동기부여 컨설팅", "성과급·인센티브 설계 자문"] },
  { text: "동기부여 컨설팅을 통해 평가·보상·리더십을 함께 개선하고 싶습니다.", audience: "employer", category: "contract", services: ["동기부여 컨설팅", "인사평가 제도 설계"] },
  { text: "노조와 임단협 협상 전 사전 의제 설계가 필요합니다.", audience: "employer", category: "other", services: ["단체교섭 전략 자문", "단체협약 검토 자문"] },
  { text: "쟁의행위 예고 통지를 받았고 비상 대응 체계를 구성해야 합니다.", audience: "employer", category: "other", services: ["노동쟁의 대응 자문", "직장폐쇄·쟁의 국면 대응"] },
  { text: "외주 인력 사용이 늘어 파견법 위반 여부를 점검해야 합니다.", audience: "employer", category: "contract", services: ["파견·도급 적법성 진단", "원·하청 노무리스크 점검"] },
  { text: "협력사 근로자 이슈가 원청 책임으로 번질까 우려됩니다.", audience: "employer", category: "contract", services: ["원·하청 노무리스크 점검", "사업주·인사담당 노무자문"] },
  { text: "스타트업인데 인사노무 체계를 처음부터 세팅하고 싶습니다.", audience: "employer", category: "contract", services: ["사업주·인사담당 노무자문", "취업규칙 제·개정 자문"] },
  { text: "근무제도 개편으로 유연근무와 시차출퇴근을 도입하려고 합니다.", audience: "employer", category: "contract", services: ["인사규정 정비 자문", "취업규칙 제·개정 자문"] },
  { text: "우리 회사 급여체계를 직무 중심으로 바꾸는 프로젝트를 맡았습니다.", audience: "employer", category: "contract", services: ["임금체계 개편 자문", "성과급·인센티브 설계 자문"] },
  { text: "팀장 교육으로 징계 절차와 괴롭힘 대응을 함께 다루고 싶습니다.", audience: "employer", category: "harassment", services: ["사내 교육(노동법·인사실무)", "직장 내 괴롭힘 예방체계 구축"] },
  { text: "전사 규정집을 최신 노동법에 맞게 업데이트하려고 합니다.", audience: "employer", category: "contract", services: ["노동관계 법정의무 컴플라이언스 점검", "인사규정 정비 자문"] },
  { text: "외국인 근로자 포함 계약서 체계를 정비하고 싶습니다.", audience: "employer", category: "contract", services: ["근로계약서 점검·작성", "사업주·인사담당 노무자문"] },
  { text: "근로자 대표 선출과 노사협의회 의결 절차가 맞는지 봐주세요.", audience: "employer", category: "contract", services: ["노사협의회 설치·운영 자문", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "법정의무 교육부터 취업규칙 신고까지 원스톱으로 받고 싶습니다.", audience: "employer", category: "contract", services: ["사업주·인사담당 노무자문", "취업규칙 제·개정 자문"] },
  { text: "직원이 부당징계를 주장해 대응 전략을 준비 중입니다.", audience: "employer", category: "dismissal", services: ["징계위원회 운영 자문", "사업주·인사담당 노무자문"] },
  { text: "근로감독에서 임금체계와 연장근로 운영 지적을 받았습니다.", audience: "employer", category: "contract", services: ["노동청 근로감독 대응", "임금체계 개편 자문"] },
  { text: "성과평가 결과에 대한 이의제기 절차를 설계하고 싶습니다.", audience: "employer", category: "contract", services: ["인사평가 제도 설계", "인사규정 정비 자문"] },
  { text: "부서별 보상편차가 커서 보상 철학과 체계를 재정립하려 합니다.", audience: "employer", category: "contract", services: ["임금체계 개편 자문", "성과급·인센티브 설계 자문"] },
  { text: "채용 급증으로 인사노무 컴플라이언스 점검이 급합니다.", audience: "employer", category: "contract", services: ["노동관계 법정의무 컴플라이언스 점검", "사업주·인사담당 노무자문"] },
  { text: "지사별로 다른 인사규정을 통합하고 징계기준을 표준화하려고 합니다.", audience: "employer", category: "contract", services: ["인사규정 정비 자문", "징계위원회 운영 자문"] },
  { text: "노조와의 갈등이 길어져 외부 자문사와 장기 대응을 원합니다.", audience: "employer", category: "other", services: ["인사노무 정기 자문(월 고문)", "노동쟁의 대응 자문"] },
  { text: "평가와 보상, 승진 체계를 한 번에 리디자인하고 싶습니다.", audience: "employer", category: "contract", services: ["인사평가 제도 설계", "임금체계 개편 자문"] },
  { text: "사내 신고센터를 만들고 괴롭힘 조사 체계도 같이 구축하려고 합니다.", audience: "employer", category: "harassment", services: ["고충처리제도 구축", "직장 내 괴롭힘 예방체계 구축"] },
  { text: "성희롱 사건 대응 매뉴얼과 교육 커리큘럼을 만들고 싶습니다.", audience: "employer", category: "harassment", services: ["직장 내 성희롱 예방체계 구축", "사내 교육(노동법·인사실무)"] },
  { text: "단체협약 문구가 실제 운영과 맞지 않아 개정 검토가 필요합니다.", audience: "employer", category: "other", services: ["단체협약 검토 자문", "단체교섭 전략 자문"] },
  { text: "원하청 구조에서 산재 책임 분담 기준이 애매해 리스크가 큽니다.", audience: "employer", category: "contract", services: ["원·하청 노무리스크 점검", "노동관계 법정의무 컴플라이언스 점검"] },
  { text: "내부 감사에서 임금과 근로시간 법 위반 가능성이 발견됐습니다.", audience: "employer", category: "contract", services: ["노동관계 법정의무 컴플라이언스 점검", "노무 진단 보고서 작성"] },
  { text: "월급 미지급 진정", audience: "worker", category: "wage_arrears", services: ["임금체불 진정사건 대리", "전문 공인노무사 상담"] },
  { text: "퇴직금 미지급 청구", audience: "worker", category: "wage_arrears", services: ["퇴직금 청구 대리", "임금체불 진정사건 대리"] },
  { text: "연장근로 수당 청구", audience: "worker", category: "wage_arrears", services: ["연장·야간·휴일수당 청구", "전문 공인노무사 상담"] },
  { text: "부당해고 구제신청", audience: "worker", category: "dismissal", services: ["부당해고 구제신청 대리", "전문 공인노무사 상담"] },
  { text: "권고사직 강요 대응", audience: "worker", category: "dismissal", services: ["권고사직·사직강요 대응", "부당해고 구제신청 대리"] },
  { text: "괴롭힘 폭언 신고", audience: "worker", category: "harassment", services: ["직장 내 괴롭힘 신고 지원", "전문 공인노무사 상담"] },
  { text: "성희롱 사건 신고 지원", audience: "worker", category: "harassment", services: ["직장 내 성희롱 신고 지원", "전문 공인노무사 상담"] },
  { text: "괴롭힘 신고 접수 조사", audience: "employer", category: "harassment", services: ["직장 내 괴롭힘 전문 조사", "직장 내 괴롭힘"] },
  { text: "성희롱 신고 접수 조사", audience: "employer", category: "harassment", services: ["직장 내 성희롱 전문 조사", "직장 내 성희롱"] },
  { text: "징계 사안 접수 조사", audience: "employer", category: "dismissal", services: ["징계 사안 전문 조사", "징계위원회 운영 자문"] },
  { text: "산재 신청 대리", audience: "worker", category: "industrial_accident", services: ["산재보상 신청 대리", "업무상질병 산재 인정 대응"] },
  { text: "취업규칙 개정 자문", audience: "employer", category: "contract", services: ["취업규칙 제·개정 자문", "사업주·인사담당 노무자문"] },
  { text: "임금체계 개편 설계", audience: "employer", category: "contract", services: ["임금체계 개편 자문", "성과급·인센티브 설계 자문"] },
  { text: "단체교섭 전략 자문", audience: "employer", category: "other", services: ["단체교섭 전략 자문", "단체협약 검토 자문"] },
  { text: "파견 도급 적법성 진단", audience: "employer", category: "contract", services: ["파견·도급 적법성 진단", "원·하청 노무리스크 점검"] },
];

const learnedExamples = learnedExamplesRaw as LearnedDiscoveryExample[];

const LEARNED_EXAMPLES: DiscoveryExample[] = Array.isArray(learnedExamples)
  ? learnedExamples
      .filter((item) => {
        const text = String(item?.text || "").trim();
        const audience = item?.audience;
        const category = item?.category;
        const services = Array.isArray(item?.services) ? item.services.filter(Boolean) : [];
        const count = Number(item?.count || 0);
        return (
          text.length >= 6 &&
          (audience === "worker" || audience === "employer") &&
          typeof category === "string" &&
          services.length > 0 &&
          count >= 2
        );
      })
      .map((item) => ({
        text: String(item.text),
        audience: item.audience as DiscoveryAudience,
        category: item.category as DiscoveryCategory,
        services: canonicalizeServices((item.services || []).map((service) => String(service))),
      }))
  : [];

const mismatchExamples = mismatchExamplesRaw as LearnedDiscoveryExample[];
const MISMATCH_EXAMPLES: DiscoveryExample[] = Array.isArray(mismatchExamples)
  ? mismatchExamples
      .filter((item) => {
        const text = String(item?.text || "").trim();
        const audience = item?.audience;
        const category = item?.category;
        const services = Array.isArray(item?.services) ? item.services.filter(Boolean) : [];
        return text.length >= 4 && (audience === "worker" || audience === "employer") && typeof category === "string" && services.length > 0;
      })
      .map((item) => ({
        text: String(item.text),
        audience: item.audience as DiscoveryAudience,
        category: item.category as DiscoveryCategory,
        services: canonicalizeServices((item.services || []).map((service) => String(service))),
      }))
  : [];

const ALL_EXAMPLES: DiscoveryExample[] = [...EXAMPLES, ...LEARNED_EXAMPLES, ...MISMATCH_EXAMPLES];

function normalize(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function compact(text: string) {
  return normalize(text).replace(/[^0-9a-z가-힣]/g, "");
}

function splitTokens(text: string) {
  return normalize(text)
    .split(/[^0-9a-z가-힣]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function buildNgrams(text: string, size: number) {
  const value = compact(text);
  if (value.length < size) return new Set<string>(value ? [value] : []);
  const grams = new Set<string>();
  for (let i = 0; i <= value.length - size; i += 1) {
    grams.add(value.slice(i, i + size));
  }
  return grams;
}

function jaccard<T>(a: Set<T>, b: Set<T>) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function textSimilarity(a: string, b: string) {
  const tokenA = new Set(splitTokens(a));
  const tokenB = new Set(splitTokens(b));
  const biA = buildNgrams(a, 2);
  const biB = buildNgrams(b, 2);
  const triA = buildNgrams(a, 3);
  const triB = buildNgrams(b, 3);

  const tokenScore = jaccard(tokenA, tokenB);
  const biScore = jaccard(biA, biB);
  const triScore = jaccard(triA, triB);

  const ca = compact(a);
  const cb = compact(b);
  const containsBoost = ca && cb && (ca.includes(cb) || cb.includes(ca)) && Math.min(ca.length, cb.length) >= 4 ? 0.34 : 0;

  return tokenScore * 0.35 + biScore * 0.35 + triScore * 0.3 + containsBoost;
}

export function inferByExamples(text: string): DiscoveryExampleSignals {
  const scored = ALL_EXAMPLES.map((example) => ({
    example,
    score: textSimilarity(text, example.text),
  }))
    .filter((item) => item.score >= 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  if (scored.length === 0) {
    return { confidence: 0, serviceScores: {} };
  }

  const audienceVotes: Record<DiscoveryAudience, number> = { worker: 0, employer: 0 };
  const categoryVotes: Partial<Record<DiscoveryCategory, number>> = {};
  const serviceScores: Record<string, number> = {};
  const confidence = scored[0]?.score || 0;

  for (let i = 0; i < scored.length; i += 1) {
    const item = scored[i];
    const rankDecay = Math.max(0.5, 1 - i * 0.08);
    const weight = item.score * rankDecay;
    audienceVotes[item.example.audience] += weight;
    categoryVotes[item.example.category] = (categoryVotes[item.example.category] || 0) + weight;
    for (const service of item.example.services) {
      serviceScores[service] = (serviceScores[service] || 0) + weight;
    }
  }

  const audience = audienceVotes.worker >= audienceVotes.employer ? "worker" : "employer";
  let category: DiscoveryCategory | undefined;
  let best = 0;
  for (const [name, score] of Object.entries(categoryVotes) as Array<[DiscoveryCategory, number]>) {
    if (score > best) {
      best = score;
      category = name;
    }
  }

  return {
    confidence,
    audience: confidence >= 0.18 ? audience : undefined,
    category: confidence >= 0.18 ? category : undefined,
    serviceScores,
  };
}

export function getDiscoveryExamplesCount() {
  return ALL_EXAMPLES.length;
}
