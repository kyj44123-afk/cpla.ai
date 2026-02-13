import fs from "fs";
import path from "path";
import { BASE_LABOR_SERVICES } from "../src/lib/laborServicesCatalog.ts";
import mismatchExamples from "../src/lib/discoveryMismatchExamples.json" with { type: "json" };

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");
const REPORT_JSON_PATH = path.join(process.cwd(), "docs", "discovery-matching-audit-report.json");
const REPORT_MD_PATH = path.join(process.cwd(), "docs", "discovery-matching-audit-report.md");

const WEB_SEEDS = [
  {
    source: "Wanted HR 커뮤니티 인터뷰(인사담당자 고민 주제)",
    url: "https://www.wanted.co.kr/events/22_06_s08_b01",
    questions: [
      "급여 테이블을 다시 짜야 하는데 어디부터 시작해야 하나요?",
      "인사평가와 보상을 연동하려면 어떤 기준이 필요할까요?",
      "근로감독을 앞두고 우선 점검할 문서는 무엇인가요?",
      "취업규칙 개정 시 현장에서 가장 많이 막히는 지점은 어디인가요?",
      "노조와 교섭 전에 인사팀이 먼저 준비해야 할 자료는 무엇인가요?",
    ],
  },
  {
    source: "원티드 소셜 HR 아티클(커뮤니티에서 자주 언급되는 질문 주제)",
    url: "https://social.wanted.co.kr/community/article/112935",
    questions: [
      "연장근로수당 계산 기준이 맞는지 점검받고 싶어요.",
      "퇴직금 산정 기준이 헷갈리는데 검토가 필요해요.",
      "근로계약서 필수 기재사항이 누락된 것 같아요.",
      "직장 내 괴롭힘 신고 후 절차가 어떻게 진행되나요?",
      "산재 신청 시 어떤 자료를 먼저 준비해야 하나요?",
    ],
  },
  {
    source: "직장인 커뮤니티 근무표 질문(교대근무 패턴/휴게시간 관심사)",
    url: "https://www.teamblind.com/kr/post/%EC%B2%A0%EB%8F%84%EA%B8%B0%EA%B4%80%EC%82%AC%EB%8B%98-%EA%B7%BC%EB%AC%B4%ED%91%9C-%EC%A7%88%EB%AC%B8-2wRhgn5o",
    questions: [
      "교대제 근무표를 만들고 싶은데 법 위반 없이 설계하려면?",
      "시프트 운영 중 야간수당이 과도하게 나와 개선하고 싶어요.",
      "인사규정과 실제 운영이 달라 분쟁이 생기고 있어요.",
      "노동청 시정지시를 받은 뒤 재점검은 어떻게 해야 하나요?",
      "파견·도급 구조가 불법파견인지 미리 진단받고 싶어요.",
    ],
  },
];

const HARD_KEYWORD_SERVICE_RULES = [
  { keywords: ["연봉제", "직무급"], service: "임금체계 개편 자문" },
  { keywords: ["보상", "인센티브", "성과급"], service: "성과급·인센티브 설계 자문" },
  { keywords: ["평가제도", "성과관리", "인사평가"], service: "인사평가 제도 설계" },
  { keywords: ["징계위원회", "징계절차"], service: "징계위원회 운영 자문" },
  { keywords: ["시정지시"], service: "노동청 근로감독 대응" },
  { keywords: ["컴플라이언스", "법정의무", "노동법"], service: "노동관계 법정의무 컴플라이언스 점검" },
  { keywords: ["4대보험", "취득", "상실", "보수"], service: "4대보험 취득·상실 정정 자문" },
  { keywords: ["근로자참여", "협의"], service: "노사협의회 설치·운영 자문" },
  { keywords: ["고충처리"], service: "고충처리제도 구축" },
  { keywords: ["고충상담", "분쟁예방"], service: "고충처리제도 구축" },
  { keywords: ["노동조합", "교섭", "노조"], service: "단체교섭 전략 자문" },
  { keywords: ["단체협약", "협약검토"], service: "단체협약 검토 자문" },
  { keywords: ["노동쟁의", "파업", "쟁의행위"], service: "노동쟁의 대응 자문" },
  { keywords: ["부당노동행위", "노조활동"], service: "부당노동행위 구제신청 지원" },
  { keywords: ["비정규직", "차별시정"], service: "비정규직 차별시정 대응" },
  { keywords: ["기간제"], service: "비정규직 차별시정 대응" },
  { keywords: ["원하청", "협력사", "노무리스크"], service: "원·하청 노무리스크 점검" },
  { keywords: ["직장폐쇄", "쟁의", "노사갈등"], service: "직장폐쇄·쟁의 국면 대응" },
  { keywords: ["실사", "dd", "m&a"], service: "기업 인사노무 실사(DD)" },
  { keywords: ["계약"], service: "근로계약서 점검·작성" },
  { keywords: ["전보", "전직"], service: "부당전직·전보 대응" },
  { keywords: ["교대제", "근무표", "시프트", "스케줄"], service: "교대제·근무표 설계 자문" },
  { keywords: ["취업규칙", "불이익변경"], service: "취업규칙 제·개정 자문" },
  { keywords: ["근로계약서", "근로조건", "계약서"], service: "근로계약서 점검·작성" },
  { keywords: ["인사규정", "규정", "징계규정"], service: "인사규정 정비 자문" },
  { keywords: ["단체교섭", "단체협약", "노조"], service: "단체교섭 전략 자문" },
  { keywords: ["파견", "도급", "불법파견"], service: "파견·도급 적법성 진단" },
  { keywords: ["근로감독", "컴플라이언스", "법정의무"], service: "노동청 근로감독 대응" },
  { keywords: ["hr", "노무자문", "인사담당"], service: "사업주·인사담당 노무자문" },
  { keywords: ["미교부", "임금명세서"], service: "임금명세서 위반 대응" },
  { keywords: ["체당금", "대지급금"], service: "대지급금 신청 대리" },
  { keywords: ["미지급", "임금체불", "체불", "진정"], service: "임금체불 진정사건 대리" },
  { keywords: ["퇴직금"], service: "퇴직금 청구 대리" },
  { keywords: ["괴롭힘"], service: "직장 내 괴롭힘 신고 대응" },
  { keywords: ["성희롱"], service: "직장 내 성희롱 대응" },
  { keywords: ["직업병"], service: "업무상질병 산재 인정 대응" },
  { keywords: ["장의비"], service: "유족급여·장의비 청구 지원" },
];

const SEMANTIC_ALIGNMENT_GROUPS = [
  {
    keywords: ["보상", "성과급", "인센티브", "연봉제", "직무급"],
    services: ["임금체계 개편 자문", "성과급·인센티브 설계 자문", "인사평가 제도 설계"],
  },
  {
    keywords: ["노조", "노동조합", "교섭", "단체협약", "단체교섭"],
    services: ["단체교섭 전략 자문", "단체협약 검토 자문", "노동쟁의 대응 자문", "부당노동행위 구제신청 지원"],
  },
  {
    keywords: ["고충처리", "고충상담", "분쟁예방"],
    services: ["고충처리제도 구축", "직장 내 괴롭힘 예방체계 구축", "사업주·인사담당 노무자문"],
  },
  {
    keywords: ["노동쟁의", "파업", "쟁의행위", "부당노동행위", "노조활동", "비정규직", "차별시정"],
    services: ["노동쟁의 대응 자문", "부당노동행위 구제신청 지원", "비정규직 차별시정 대응", "단체교섭 전략 자문"],
  },
  {
    keywords: ["기간제", "원하청", "협력사", "노무리스크", "직장폐쇄", "쟁의", "노사갈등", "실사", "dd", "m&a"],
    services: ["비정규직 차별시정 대응", "원·하청 노무리스크 점검", "직장폐쇄·쟁의 국면 대응", "기업 인사노무 실사(DD)"],
  },
];

function normalize(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function compact(text) {
  return normalize(text).replace(/[^0-9a-z가-힣]/g, "");
}

function readManagedServices() {
  if (!fs.existsSync(SETTINGS_PATH)) return [];
  const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  const legacy = Array.isArray(parsed.labor_services) ? parsed.labor_services.map((s) => ({ ...s, audience: "worker" })) : [];
  const workers = Array.isArray(parsed.labor_services_worker) ? parsed.labor_services_worker.map((s) => ({ ...s, audience: "worker" })) : [];
  const employers = Array.isArray(parsed.labor_services_employer)
    ? parsed.labor_services_employer.map((s) => ({ ...s, audience: "employer" }))
    : [];

  return [...legacy, ...workers, ...employers]
    .map((s) => ({
      name: String(s?.name || "").trim(),
      description: String(s?.description || "").trim(),
      audience: s?.audience === "employer" ? "employer" : "worker",
      keywords: Array.isArray(s?.keywords) ? s.keywords.map((k) => String(k || "").trim()).filter(Boolean) : [],
    }))
    .filter((s) => s.name);
}

function inferAudience(question) {
  const n = compact(question);
  const workerSignals = ["회사에서", "못받", "당했", "피해", "억울", "신고", "복직", "퇴직금", "임금체불", "괴롭힘", "성희롱", "산재", "전보", "전직"];
  const planWords = ["도입", "설계", "작성", "개편", "개정", "운영", "정비", "구축", "만들", "재설계"];
  const hrDomain = [
    "취업규칙",
    "근로계약서",
    "인사규정",
    "인사평가",
    "임금체계",
    "성과급",
    "교대제",
    "근무표",
    "시프트",
    "근로감독",
    "컴플라이언스",
    "단체교섭",
    "단체협약",
    "노사협의회",
    "파견",
    "도급",
    "연봉제",
    "직무급",
    "인센티브",
    "보상",
    "평가제도",
    "성과관리",
    "징계위원회",
    "징계절차",
    "시정지시",
    "계약",
    "기간제",
    "원하청",
    "협력사",
    "노무리스크",
    "직장폐쇄",
    "쟁의",
    "노사갈등",
    "실사",
    "dd",
    "m&a",
  ];
  const employerSignals = [
    "사업주",
    "인사팀",
    "인사담당",
    "대표",
    "도입",
    "설계",
    "작성",
    "개정",
    "개편",
    "운영",
    "교대제",
    "근무표",
    "시프트",
    "근로감독",
    "컴플라이언스",
    "단체교섭",
    "파견",
    "도급",
    "연봉제",
    "직무급",
    "인센티브",
    "보상",
    "평가제도",
    "성과관리",
    "징계위원회",
    "징계절차",
    "시정지시",
    "기간제",
    "원하청",
    "협력사",
    "노무리스크",
    "직장폐쇄",
    "쟁의",
    "노사갈등",
    "실사",
    "dd",
    "m&a",
  ];
  if (hrDomain.some((w) => n.includes(w)) && !workerSignals.some((w) => n.includes(w))) return "employer";
  if (planWords.some((w) => n.includes(w)) && hrDomain.some((w) => n.includes(w))) return "employer";
  return employerSignals.some((signal) => n.includes(signal)) ? "employer" : "worker";
}

function keywordScore(question, service) {
  const nQ = compact(question);
  const words = [service.name, service.description, ...(service.keywords || [])]
    .map((t) => compact(t))
    .filter(Boolean);
  let score = 0;
  for (const w of words) {
    if (!w) continue;
    if (nQ.includes(w)) score += w.length >= 4 ? 2.2 : 1.2;
  }
  const tokenBoost = (service.keywords || []).reduce((acc, k) => {
    const key = compact(k);
    if (key && nQ.includes(key)) return acc + 1.8;
    return acc;
  }, 0);
  let adjustment = 0;
  const specificSignals = [
    "미지급",
    "체당금",
    "대지급금",
    "퇴직금",
    "괴롭힘",
    "성희롱",
    "직업병",
    "장의비",
    "취업규칙",
    "근로계약서",
    "근로조건",
    "인사규정",
    "교대제",
    "근무표",
    "시프트",
    "근로감독",
    "파견",
    "도급",
    "단체교섭",
    "단체협약",
  ];
  const hasSpecificSignal = specificSignals.some((s) => nQ.includes(compact(s)));
  const isGenericCounseling = service.name === "전문 공인노무사 상담";
  if (hasSpecificSignal && isGenericCounseling) adjustment -= 4;
  if (nQ.includes(compact("체당금")) && compact(service.name).includes(compact("대지급금"))) adjustment += 8;
  if (nQ.includes(compact("대지급금")) && compact(service.name).includes(compact("대지급금"))) adjustment += 8;
  return score + tokenBoost + adjustment;
}

function pickService(question, services) {
  const audience = inferAudience(question);
  const byAudience = services.filter((s) => s.audience === audience);
  const nQ = normalize(question);
  const hardMatched = HARD_KEYWORD_SERVICE_RULES.find((rule) => rule.keywords.some((k) => compact(nQ).includes(compact(k))));
  if (hardMatched) {
    const svc = byAudience.find((s) => s.name === hardMatched.service) || services.find((s) => s.name === hardMatched.service);
    if (svc) {
      return { audience, top: svc, topScore: 99 };
    }
  }
  const mismatchBoostMap = new Map();
  for (const ex of mismatchExamples) {
    const t = normalize(ex?.text || "");
    if (!t) continue;
    const isMatch = nQ === t || nQ.includes(t) || t.includes(nQ);
    if (!isMatch) continue;
    const arr = Array.isArray(ex?.services) ? ex.services : [];
    for (const name of arr) mismatchBoostMap.set(name, (mismatchBoostMap.get(name) || 0) + 8);
  }
  const scored = byAudience
    .map((service) => {
      const base = keywordScore(question, service);
      const boost = mismatchBoostMap.get(service.name) || 0;
      return { service, score: base + boost };
    })
    .sort((a, b) => b.score - a.score);

  const genericCounselingName = "전문 공인노무사 상담";
  const genericIdx = scored.findIndex((s) => s.service.name === genericCounselingName);
  const specificExists = scored.some((s) => s.service.name !== genericCounselingName && s.score >= 3);
  if (genericIdx >= 0 && specificExists) {
    scored[genericIdx].score -= 6;
    scored.sort((a, b) => b.score - a.score);
  }
  return {
    audience,
    top: scored[0]?.service || byAudience[0] || services[0],
    topScore: scored[0]?.score || 0,
  };
}

function extractCoreKeyword(question, serviceKeywords) {
  const nQ = compact(question);
  const genericStopwords = new Set(
    ["리스크", "상담", "대응", "자문", "점검", "정비", "체계", "운영", "개선", "관리", "분쟁", "절차", "문서", "신청", "지원"].map((v) =>
      compact(v)
    )
  );
  const sorted = [...serviceKeywords].sort((a, b) => b.length - a.length);
  const found = sorted.find((k) => {
    const key = compact(k);
    if (!key || genericStopwords.has(key)) return false;
    return nQ.includes(key);
  });
  if (found) return found;

  const fallback = [
    "교대제",
    "근무표",
    "시프트",
    "취업규칙",
    "근로계약",
    "임금체계",
    "성과급",
    "인사평가",
    "근로감독",
    "컴플라이언스",
    "단체교섭",
    "단체협약",
    "파견",
    "도급",
    "임금체불",
    "퇴직금",
    "괴롭힘",
    "성희롱",
    "산재",
  ];
  return fallback.find((k) => nQ.includes(compact(k))) || "";
}

function generateQuestions(services, target = 1000) {
  const questions = [];
  const templatesEmployer = [
    "{kw} 체계를 정비하려고 합니다. 어디부터 시작하면 좋을까요?",
    "{kw} 운영을 개선하려는데 실무적으로 무엇을 먼저 해야 하나요?",
    "{kw} 도입(또는 개편) 프로젝트를 진행하려고 합니다.",
    "{kw} 관련 리스크가 커져서 점검받고 싶습니다.",
    "{kw} 때문에 현장 혼선이 큰데 제도 설계가 필요합니다.",
  ];
  const templatesWorker = [
    "{kw} 문제로 회사와 갈등이 있습니다. 어떻게 대응해야 하나요?",
    "{kw} 관련해서 제가 받을 수 있는 권리가 궁금합니다.",
    "{kw} 상황이 반복되는데 절차적으로 어떻게 진행하나요?",
    "{kw} 때문에 손해를 보고 있어 상담이 필요합니다.",
    "{kw} 이슈를 해결하려면 무엇부터 준비해야 하나요?",
  ];

  for (const svc of services) {
    const seeds = svc.keywords && svc.keywords.length > 0 ? svc.keywords.slice(0, 4) : [svc.name];
    const templates = svc.audience === "employer" ? templatesEmployer : templatesWorker;
    for (const kw of seeds) {
      for (const tpl of templates) {
        questions.push(tpl.replace("{kw}", kw));
      }
    }
  }

  for (const group of WEB_SEEDS) {
    for (const q of group.questions) questions.push(q);
  }

  const fillers = [
    "교대제 근무표 작성하고 싶어.",
    "교대근무 스케줄이 들쑥날쑥해서 기준을 만들고 싶습니다.",
    "시프트표 설계와 수당 통제를 같이 하고 싶어요.",
  ];
  questions.push(...fillers);

  const uniq = Array.from(new Set(questions.map((q) => q.trim()).filter(Boolean)));
  const expanded = [...uniq];
  let i = 0;
  while (expanded.length < target) {
    const base = uniq[i % uniq.length];
    const suffixes = [
      " 긴급하게 이번 달 안에 진행하고 싶습니다.",
      " 예산과 인력 제약을 고려한 방안이 필요합니다.",
      " 분쟁 없이 적용 가능한 방식이면 좋겠습니다.",
      " 내부 커뮤니케이션까지 같이 설계하고 싶습니다.",
      " 담당자 교육까지 포함해서 검토하고 싶습니다.",
    ];
    expanded.push(`${base}${suffixes[i % suffixes.length]}`);
    i += 1;
  }
  return expanded.slice(0, target);
}

function buildReport(questions, services) {
  const allKeywords = Array.from(
    new Set(services.flatMap((s) => [s.name, ...(s.keywords || [])]).map((v) => String(v || "").trim()).filter(Boolean))
  );

  const results = questions.map((question) => {
    const picked = pickService(question, services);
    const coreKeyword = extractCoreKeyword(question, allKeywords);
    const svcText = `${picked.top.name} ${picked.top.description} ${(picked.top.keywords || []).join(" ")}`;
    let semanticAligned = false;
    if (coreKeyword) {
      const key = compact(coreKeyword);
      semanticAligned = SEMANTIC_ALIGNMENT_GROUPS.some(
        (group) => group.keywords.some((k) => compact(k) === key) && group.services.includes(picked.top.name)
      );
    }
    const aligned = coreKeyword ? compact(svcText).includes(compact(coreKeyword)) || semanticAligned : picked.topScore > 0;
    const keywordCoveredInCatalog = coreKeyword ? allKeywords.some((k) => compact(k) === compact(coreKeyword)) : true;

    return {
      question,
      audience: picked.audience,
      coreKeyword,
      recommendedService: picked.top.name,
      score: Number(picked.topScore.toFixed(2)),
      aligned,
      keywordCoveredInCatalog,
    };
  });

  const mismatches = results.filter((r) => !r.aligned);
  const missingKeywordMap = new Map();
  for (const row of results) {
    if (!row.coreKeyword || row.keywordCoveredInCatalog) continue;
    missingKeywordMap.set(row.coreKeyword, (missingKeywordMap.get(row.coreKeyword) || 0) + 1);
  }

  const missingKeywords = Array.from(missingKeywordMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([keyword, count]) => ({ keyword, count }));

  return {
    generatedQuestions: questions.length,
    alignedCount: results.length - mismatches.length,
    alignedRate: Number((((results.length - mismatches.length) / results.length) * 100).toFixed(2)),
    mismatchCount: mismatches.length,
    mismatchTop20: mismatches.slice(0, 20),
    missingKeywords,
    webSeedSources: WEB_SEEDS.map((s) => ({ source: s.source, url: s.url, sampleQuestions: s.questions })),
  };
}

function writeReports(report) {
  fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2), "utf-8");

  const md = [
    "# Discovery Matching Audit",
    "",
    `- Generated questions: **${report.generatedQuestions}**`,
    `- Alignment rate: **${report.alignedRate}%**`,
    `- Mismatch count: **${report.mismatchCount}**`,
    "",
    "## Web Seed Sources",
    ...report.webSeedSources.flatMap((s) => [`- ${s.source}: ${s.url}`, ...s.sampleQuestions.map((q) => `  - ${q}`)]),
    "",
    "## Top Mismatches (20)",
    ...report.mismatchTop20.map((m) => `- Q: ${m.question} / KW: ${m.coreKeyword || "-"} / Service: ${m.recommendedService}`),
    "",
    "## Missing Keywords In Catalog",
    ...(report.missingKeywords.length > 0
      ? report.missingKeywords.map((m) => `- ${m.keyword}: ${m.count}`)
      : ["- none"]),
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_MD_PATH, md, "utf-8");
}

function main() {
  const managed = readManagedServices();
  const merged = new Map();
  for (const svc of [...BASE_LABOR_SERVICES, ...managed]) {
    const key = `${svc.audience}:${svc.name}`;
    merged.set(key, {
      name: svc.name,
      description: svc.description || "",
      audience: svc.audience === "employer" ? "employer" : "worker",
      keywords: Array.isArray(svc.keywords) ? svc.keywords : [],
    });
  }
  const services = Array.from(merged.values());
  const questions = generateQuestions(services, 1000);
  const report = buildReport(questions, services);
  writeReports(report);

  console.log(`Generated questions: ${report.generatedQuestions}`);
  console.log(`Alignment rate: ${report.alignedRate}%`);
  console.log(`Mismatch count: ${report.mismatchCount}`);
  console.log(`JSON report: ${REPORT_JSON_PATH}`);
  console.log(`MD report: ${REPORT_MD_PATH}`);
}

main();
