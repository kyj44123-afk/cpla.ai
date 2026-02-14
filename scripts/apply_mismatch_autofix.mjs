import fs from "fs";
import path from "path";

const REPORT_PATH = path.join(process.cwd(), "docs", "discovery-matching-audit-report.json");
const OUTPUT_PATH = path.join(process.cwd(), "src", "lib", "discoveryMismatchExamples.json");

const KEYWORD_SERVICE_MAP = [
  { keywords: ["미지급", "임금체불", "체불", "진정"], service: "임금체불 진정사건 대리", audience: "worker", category: "wage_arrears" },
  { keywords: ["체당금", "대지급금"], service: "대지급금 신청 대리", audience: "worker", category: "wage_arrears" },
  { keywords: ["퇴직금"], service: "퇴직금 청구 대리", audience: "worker", category: "wage_arrears" },
  { keywords: ["미교부", "임금명세서"], service: "임금명세서 위반 대응", audience: "worker", category: "wage_arrears" },
  { keywords: ["괴롭힘"], service: "직장 내 괴롭힘 신고 지원", audience: "worker", category: "harassment" },
  { keywords: ["성희롱"], service: "직장 내 성희롱 신고 지원", audience: "worker", category: "harassment" },
  { keywords: ["직업병"], service: "업무상질병 산재 인정 대응", audience: "worker", category: "industrial_accident" },
  { keywords: ["장의비"], service: "유족급여·장의비 청구 지원", audience: "worker", category: "industrial_accident" },
  { keywords: ["취업규칙", "불이익변경"], service: "취업규칙 제·개정 자문", audience: "employer", category: "contract" },
  { keywords: ["근로계약서", "근로조건"], service: "근로계약서 점검·작성", audience: "employer", category: "contract" },
  { keywords: ["규정"], service: "인사규정 정비 자문", audience: "employer", category: "contract" },
  { keywords: ["hr", "노무자문"], service: "사업주·인사담당 노무자문", audience: "employer", category: "contract" },
  { keywords: ["연봉제", "직무급"], service: "임금체계 개편 자문", audience: "employer", category: "contract" },
  { keywords: ["보상", "인센티브", "성과급"], service: "성과급·인센티브 설계 자문", audience: "employer", category: "contract" },
  { keywords: ["평가제도", "성과관리"], service: "인사평가 제도 설계", audience: "employer", category: "contract" },
  { keywords: ["징계위원회", "징계절차"], service: "징계위원회 운영 자문", audience: "employer", category: "dismissal" },
  { keywords: ["근로감독", "시정지시"], service: "노동청 근로감독 대응", audience: "employer", category: "contract" },
  { keywords: ["컴플라이언스", "법정의무", "노동법"], service: "노동관계 법정의무 컴플라이언스 점검", audience: "employer", category: "contract" },
  { keywords: ["4대보험", "취득", "상실", "보수"], service: "4대보험 취득·상실 정정 자문", audience: "employer", category: "contract" },
  { keywords: ["근로자참여", "협의"], service: "노사협의회 설치·운영 자문", audience: "employer", category: "contract" },
  { keywords: ["고충처리", "고충상담", "분쟁예방"], service: "고충처리제도 구축", audience: "employer", category: "harassment" },
  { keywords: ["노동조합", "노조", "교섭"], service: "단체교섭 전략 자문", audience: "employer", category: "other" },
  { keywords: ["단체협약", "협약검토"], service: "단체협약 검토 자문", audience: "employer", category: "other" },
  { keywords: ["노동쟁의", "파업", "쟁의행위"], service: "노동쟁의 대응 자문", audience: "employer", category: "other" },
  { keywords: ["부당노동행위", "노조활동"], service: "부당노동행위 구제신청 지원", audience: "employer", category: "other" },
  { keywords: ["비정규직", "차별시정", "기간제"], service: "비정규직 차별시정 대응", audience: "employer", category: "contract" },
  { keywords: ["파견", "도급", "불법파견"], service: "파견·도급 적법성 진단", audience: "employer", category: "contract" },
  { keywords: ["원하청", "협력사", "노무리스크"], service: "원·하청 노무리스크 점검", audience: "employer", category: "contract" },
  { keywords: ["직장폐쇄", "쟁의", "노사갈등"], service: "직장폐쇄·쟁의 국면 대응", audience: "employer", category: "other" },
  { keywords: ["실사", "dd", "m&a"], service: "기업 인사노무 실사(DD)", audience: "employer", category: "contract" },
  { keywords: ["전보", "전직"], service: "부당전직·전보 대응", audience: "worker", category: "dismissal" },
];

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function pickMappedService(question, coreKeyword, fallbackAudience) {
  const n = normalize(`${question} ${coreKeyword}`);
  const mapped = KEYWORD_SERVICE_MAP.find((rule) => rule.keywords.some((k) => n.includes(normalize(k))));
  if (!mapped) return null;
  return {
    service: mapped.service,
    audience: mapped.audience || fallbackAudience || "worker",
    category: mapped.category || "other",
  };
}

function build() {
  const report = readJson(REPORT_PATH);
  if (!report) {
    throw new Error(`Missing report file: ${REPORT_PATH}`);
  }
  const top = Array.isArray(report.mismatchTop20) ? report.mismatchTop20 : [];
  const generated = [];
  const seen = new Set();

  for (const row of top) {
    const question = String(row.question || "").trim();
    if (!question) continue;
    const mapped = pickMappedService(question, row.coreKeyword, row.audience);
    if (!mapped) continue;
    const key = `${mapped.audience}|${mapped.category}|${question}|${mapped.service}`;
    if (seen.has(key)) continue;
    seen.add(key);
    generated.push({
      text: question,
      audience: mapped.audience,
      category: mapped.category,
      services: [mapped.service],
      source: "audit_mismatch_autofix",
    });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(generated, null, 2), "utf-8");
  console.log(`Generated mismatch examples: ${generated.length}`);
  console.log(`Wrote: ${OUTPUT_PATH}`);
}

build();
