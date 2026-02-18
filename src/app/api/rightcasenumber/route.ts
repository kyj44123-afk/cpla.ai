import { NextResponse } from "next/server";
import { getNationalLawApiKey } from "@/lib/settings";

const LAW_API_BASE = "https://www.law.go.kr/DRF";

type PrecedentCandidate = {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  judgeDate: string;
};

function stripTagContent(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTagValues(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "g");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    values.push(stripTagContent(match[1] || ""));
  }
  return values;
}

function extractFirstTagValue(xml: string, tagNames: string[]): string {
  for (const tag of tagNames) {
    const value = extractTagValues(xml, tag)[0];
    if (value) return value;
  }
  return "";
}

async function decodeXmlResponse(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";
  const charsetMatch = contentType.match(/charset=([^;]+)/i);
  const charset = (charsetMatch?.[1] || "").trim().toLowerCase();
  const bytes = new Uint8Array(await response.arrayBuffer());

  const decodeWith = (label: string): string => {
    try {
      return new TextDecoder(label).decode(bytes);
    } catch {
      return "";
    }
  };

  if (charset) {
    const decoded = decodeWith(charset);
    if (decoded) return decoded;
  }

  const utf8 = decodeWith("utf-8");
  if (utf8) return utf8;
  const eucKr = decodeWith("euc-kr");
  if (eucKr) return eucKr;
  return "";
}

function normalizeCaseNumber(value: string): string {
  return value.replace(/[\s\-_/.,]/g, "").toLowerCase();
}

function normalizeCompareText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s"'`‘’“”.,;:!?()[\]{}<>·ㆍ…\-_/\\]/g, "")
    .trim();
}

function tokenize(value: string): string[] {
  const matches = value.match(/[0-9A-Za-z가-힣]{2,}/g) || [];
  return Array.from(new Set(matches.map((t) => t.toLowerCase())));
}

function findBestSnippet(source: string, quote: string): string {
  const quoteTokens = tokenize(quote).slice(0, 6);
  if (quoteTokens.length === 0) return source.slice(0, 180);

  const sentences = source.split(/(?<=[.!?다요\.])\s+/).filter(Boolean);
  for (const sentence of sentences) {
    const normalized = normalizeCompareText(sentence);
    if (quoteTokens.some((t) => normalized.includes(normalizeCompareText(t)))) {
      return sentence.slice(0, 220);
    }
  }
  return source.slice(0, 220);
}

function computeQuoteMatch(officialText: string, quotedText: string) {
  const officialNorm = normalizeCompareText(officialText);
  const quoteNorm = normalizeCompareText(quotedText);

  if (!quoteNorm || !officialNorm) {
    return {
      isMatched: false,
      confidence: 0,
      overlapRatio: 0,
      exactContained: false,
      snippet: "",
    };
  }

  const exactContained = quoteNorm.length >= 8 && officialNorm.includes(quoteNorm);
  if (exactContained) {
    return {
      isMatched: true,
      confidence: 0.98,
      overlapRatio: 1,
      exactContained: true,
      snippet: findBestSnippet(officialText, quotedText),
    };
  }

  const tokens = tokenize(quotedText);
  if (tokens.length === 0) {
    return {
      isMatched: false,
      confidence: 0,
      overlapRatio: 0,
      exactContained: false,
      snippet: "",
    };
  }

  const matchedTokenCount = tokens.filter((token) => officialNorm.includes(normalizeCompareText(token))).length;
  const overlapRatio = matchedTokenCount / tokens.length;
  const isMatched = overlapRatio >= 0.6;
  const confidence = Math.min(0.9, Number((overlapRatio * 0.9).toFixed(2)));

  return {
    isMatched,
    confidence,
    overlapRatio: Number(overlapRatio.toFixed(2)),
    exactContained: false,
    snippet: findBestSnippet(officialText, quotedText),
  };
}

function parsePrecedentCandidates(xml: string): PrecedentCandidate[] {
  const blocks = xml.match(/<prec[\s\S]*?<\/prec>/g) || [];
  return blocks
    .map((block) => ({
      id: extractFirstTagValue(block, ["판례일련번호", "판례정보일련번호", "ID"]),
      title: extractFirstTagValue(block, ["사건명", "판례명", "제목"]),
      caseNumber: extractFirstTagValue(block, ["사건번호"]),
      court: extractFirstTagValue(block, ["법원명"]),
      judgeDate: extractFirstTagValue(block, ["선고일자"]),
    }))
    .filter((item) => Boolean(item.id && item.caseNumber));
}

async function searchByCaseNumber(apiKey: string, caseNumber: string): Promise<PrecedentCandidate[]> {
  const url = new URL(`${LAW_API_BASE}/lawSearch.do`);
  url.searchParams.set("OC", apiKey);
  url.searchParams.set("target", "prec");
  url.searchParams.set("type", "XML");
  url.searchParams.set("query", caseNumber);
  url.searchParams.set("search", "1");
  url.searchParams.set("display", "20");
  url.searchParams.set("page", "1");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`판례 검색 실패 (status=${response.status})`);
  }
  const xml = await decodeXmlResponse(response);
  return parsePrecedentCandidates(xml);
}

async function fetchPrecedentDetailXml(apiKey: string, id: string): Promise<string> {
  const url = new URL(`${LAW_API_BASE}/lawService.do`);
  url.searchParams.set("OC", apiKey);
  url.searchParams.set("target", "prec");
  url.searchParams.set("ID", id);
  url.searchParams.set("type", "XML");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`판례 상세 조회 실패 (status=${response.status})`);
  }
  return decodeXmlResponse(response);
}

function extractOfficialSourceText(detailXml: string): string {
  const sections = [
    ...extractTagValues(detailXml, "판결요지"),
    ...extractTagValues(detailXml, "판시사항"),
    ...extractTagValues(detailXml, "판례내용"),
    ...extractTagValues(detailXml, "이유"),
    ...extractTagValues(detailXml, "주문"),
  ]
    .join("\n")
    .trim();

  if (sections) return sections;
  return stripTagContent(detailXml);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caseNumber = typeof body.caseNumber === "string" ? body.caseNumber.trim() : "";
    const quotedText = typeof body.quotedText === "string" ? body.quotedText.trim() : "";

    if (!caseNumber || !quotedText) {
      return NextResponse.json({ error: "사건번호와 인용문을 모두 입력해 주세요." }, { status: 400 });
    }

    const apiKey = getNationalLawApiKey().trim();
    if (!apiKey) {
      return NextResponse.json({ error: "국가법령정보센터 API 키가 설정되지 않았습니다." }, { status: 400 });
    }

    const candidates = await searchByCaseNumber(apiKey, caseNumber);
    const normalizedInput = normalizeCaseNumber(caseNumber);

    const target =
      candidates.find((c) => normalizeCaseNumber(c.caseNumber) === normalizedInput) ||
      candidates.find((c) => normalizeCaseNumber(c.caseNumber).includes(normalizedInput)) ||
      null;

    if (!target) {
      return NextResponse.json({
        matched: false,
        verdict: "unmatched",
        reason: "입력한 사건번호와 정확히 일치하는 판례를 찾지 못했습니다.",
        candidates: candidates.slice(0, 5).map((c) => ({
          title: c.title,
          caseNumber: c.caseNumber,
          court: c.court,
          judgeDate: c.judgeDate,
        })),
      });
    }

    const detailXml = await fetchPrecedentDetailXml(apiKey, target.id);
    const officialText = extractOfficialSourceText(detailXml);
    const match = computeQuoteMatch(officialText, quotedText);

    return NextResponse.json({
      matched: match.isMatched,
      verdict: match.isMatched ? "matched" : "unmatched",
      reason: match.isMatched
        ? "사건번호가 일치하고, 인용문이 판례 본문과 충분히 부합합니다."
        : "사건번호는 일치하지만 인용문과 판례 본문 간 일치도가 낮습니다.",
      case: {
        id: target.id,
        title: target.title,
        caseNumber: target.caseNumber,
        court: target.court,
        judgeDate: target.judgeDate,
      },
      evidence: {
        exactContained: match.exactContained,
        overlapRatio: match.overlapRatio,
        confidence: match.confidence,
        snippet: match.snippet,
      },
      note: "판례 본문 기반 1차 정합성 검증 결과입니다. 최종 법률판단은 전문가 검토가 필요합니다.",
    });
  } catch (error) {
    console.error("rightcasenumber verify error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
