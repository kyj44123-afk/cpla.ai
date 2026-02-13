import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getNationalLawApiKey } from "@/lib/settings";
import { withSecurity, validateBody } from "@/lib/api-security";
import { z } from "zod";

export const runtime = "nodejs";

const LAW_API_BASE = "https://www.law.go.kr/DRF";
const SEARCH_PAGE_SIZE = 100;
const SEARCH_MAX_PAGES = 50;

// ... (Previous Interfaces kept same) ...
type SearchTarget = "prec" | "admrul";

interface SearchItem {
  id: string;
  title: string;
}

interface SavedFile {
  category: "precedent" | "administrative_ruling";
  id: string;
  title: string;
  path: string;
}

interface TargetProbeResult {
  target: "law" | "prec" | "admrul";
  status: number;
  contentType: string;
  mode: "xml" | "html" | "unknown";
  h2: string;
}

// Zod Schema
const LawDownloadSchema = z.object({
  lawName: z.string().min(2, "법령명은 2글자 이상이어야 합니다.").max(50, "법령명은 50글자 이하여야 합니다."),
});

// ... (Helper functions: maskSecret, stripTagContent, etc. - NO CHANGE REQUIRED) ...
function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 2) return "*".repeat(value.length);
  if (value.length <= 4) return `${value[0]}${"*".repeat(value.length - 2)}${value[value.length - 1]}`;
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}

function stripTagContent(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, "")
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

function sanitizeForFilename(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function sha256Short(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 12);
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
  if (/^<\?xml[\s\S]*encoding=["']euc-kr["']/i.test(utf8) || /^<\?xml[\s\S]*encoding=["']ks_c_5601-1987["']/i.test(utf8)) {
    const eucKr = decodeWith("euc-kr");
    if (eucKr) return eucKr;
  }

  if (utf8) return utf8;
  const eucKr = decodeWith("euc-kr");
  if (eucKr) return eucKr;
  return "";
}

function extractApiError(xml: string): string {
  const candidates = [
    extractFirstTagValue(xml, ["error", "errMsg", "message", "resultMsg"]),
    ...extractTagValues(xml, "error"),
  ];
  return candidates.find(Boolean) || "";
}

function extractHtmlErrorMessage(html: string): string {
  const normalized = html.replace(/\s+/g, " ").trim();
  if (!/<html[\s>]/i.test(normalized) && !/^<!doctype html/i.test(normalized)) {
    return "";
  }

  const h2Match = normalized.match(/<h2[^>]*>(.*?)<\/h2>/i);
  const h2Text = h2Match ? stripTagContent(h2Match[1]) : "";

  if (normalized.includes("미신청된 목록/본문에 대한 접근")) {
    return "API 권한 미신청: 국가법령정보 OPEN API에서 판례/행정해석 목록·본문 권한을 신청해 주세요.";
  }

  return h2Text || "국가법령정보센터가 HTML 오류 페이지를 반환했습니다.";
}

async function probeTargetAccess(apiKey: string, target: "law" | "prec" | "admrul"): Promise<TargetProbeResult> {
  const url = new URL(`${LAW_API_BASE}/lawSearch.do`);
  url.searchParams.set("OC", apiKey);
  url.searchParams.set("target", target);
  url.searchParams.set("type", "XML");
  url.searchParams.set("query", "근로기준법");
  url.searchParams.set("display", "1");

  const response = await fetch(url.toString());
  const body = await decodeXmlResponse(response);
  const contentType = response.headers.get("content-type") || "";
  const normalized = body.replace(/\s+/g, " ").trim();
  const h2Match = normalized.match(/<h2[^>]*>(.*?)<\/h2>/i);
  const h2 = h2Match ? stripTagContent(h2Match[1]) : "";
  const mode: "xml" | "html" | "unknown" = /^<\?xml|<[A-Za-z]+Search|<[A-Za-z]+Service/.test(normalized)
    ? "xml"
    : /<html[\s>]|<!doctype html/i.test(normalized)
      ? "html"
      : "unknown";

  return {
    target,
    status: response.status,
    contentType,
    mode,
    h2,
  };
}

function parseSearchItems(xml: string, target: SearchTarget): SearchItem[] {
  const itemTag = target === "prec" ? "prec" : "admrul";
  const idTags =
    target === "prec"
      ? ["판례일련번호", "판례정보일련번호"]
      : ["행정해석일련번호", "행정규칙일련번호", "유권해석일련번호", "법령해석례일련번호"];
  const titleTags =
    target === "prec"
      ? ["사건명", "판례명", "제목"]
      : ["안건명", "제목", "건명", "해석례명"];

  const items = xml.match(new RegExp(`<${itemTag}[\\s\\S]*?<\\/${itemTag}>`, "g")) || [];
  return items
    .map((item) => ({
      id: extractFirstTagValue(item, idTags),
      title: extractFirstTagValue(item, titleTags),
    }))
    .filter((item) => Boolean(item.id && item.title));
}

function removeWhitespace(input: string): string {
  return input.replace(/\s+/g, "");
}

function hasLawCitation(detailXml: string, lawName: string): boolean {
  const normalizedLaw = removeWhitespace(lawName);
  const citationTags = [
    "참조조문",
    "참조법령",
    "관련법령",
    "근거법령",
    "법령명",
    "법령명_한글",
    "인용법령",
    "법조문",
  ];

  const citationText = citationTags
    .flatMap((tag) => extractTagValues(detailXml, tag))
    .join(" ");

  if (removeWhitespace(citationText).includes(normalizedLaw)) {
    return true;
  }

  return removeWhitespace(stripTagContent(detailXml)).includes(normalizedLaw);
}

function summarizePrecedent(detailXml: string): string {
  const summary =
    extractFirstTagValue(detailXml, ["판결요지", "판시사항"]) ||
    extractFirstTagValue(detailXml, ["판례내용"]);
  return summary || "요약을 추출하지 못했습니다.";
}

function summarizeAdmrul(detailXml: string): string {
  const summary =
    extractFirstTagValue(detailXml, ["질의요지", "회답", "내용", "해석", "이유"]) ||
    extractFirstTagValue(detailXml, ["판단", "요지"]);
  return summary || "요약을 추출하지 못했습니다.";
}

async function fetchDetailXml(target: SearchTarget, id: string, apiKey: string): Promise<string> {
  const detailUrl = new URL(`${LAW_API_BASE}/lawService.do`);
  detailUrl.searchParams.set("OC", apiKey);
  detailUrl.searchParams.set("target", target);
  detailUrl.searchParams.set("ID", id);
  detailUrl.searchParams.set("type", "XML");

  const detailRes = await fetch(detailUrl.toString());
  if (!detailRes.ok) {
    throw new Error(`${target} 상세 조회 실패 (status=${detailRes.status})`);
  }

  const detailXml = await decodeXmlResponse(detailRes);
  const htmlError = extractHtmlErrorMessage(detailXml);
  if (htmlError) {
    throw new Error(htmlError);
  }

  const apiError = extractApiError(detailXml);
  if (apiError) {
    throw new Error(`국가법령정보센터 상세 조회 오류: ${apiError}`);
  }

  return detailXml;
}

async function searchAllItems(target: SearchTarget, lawName: string, apiKey: string): Promise<{ items: SearchItem[]; truncated: boolean }> {
  // ... (No change needed inside searchAllItems, it works fine) ...
  const dedup = new Map<string, SearchItem>();
  let truncated = false;

  for (let page = 1; page <= SEARCH_MAX_PAGES; page += 1) {
    const searchUrl = new URL(`${LAW_API_BASE}/lawSearch.do`);
    searchUrl.searchParams.set("OC", apiKey);
    searchUrl.searchParams.set("target", target);
    searchUrl.searchParams.set("type", "XML");
    searchUrl.searchParams.set("query", lawName);
    searchUrl.searchParams.set("display", String(SEARCH_PAGE_SIZE));
    searchUrl.searchParams.set("page", String(page));

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      throw new Error(`${target} 검색 실패 (status=${searchRes.status})`);
    }

    const searchXml = await decodeXmlResponse(searchRes);
    const htmlError = extractHtmlErrorMessage(searchXml);
    if (htmlError) {
      throw new Error(htmlError);
    }

    const apiError = extractApiError(searchXml);
    if (apiError) {
      throw new Error(`국가법령정보센터 검색 오류: ${apiError}`);
    }

    const pageItems = parseSearchItems(searchXml, target);
    if (pageItems.length === 0) {
      break;
    }

    pageItems.forEach((item) => {
      if (!dedup.has(item.id)) dedup.set(item.id, item);
    });

    if (pageItems.length < SEARCH_PAGE_SIZE) {
      break;
    }

    if (page === SEARCH_MAX_PAGES) {
      truncated = true;
    }
  }

  return { items: Array.from(dedup.values()), truncated };
}

export async function POST(req: NextRequest) {
  // 1. Security Check (Rate Limit + Auth)
  const securityError = await withSecurity(req, { checkAuth: true, rateLimit: { limit: 10, windowMs: 60000 } });
  if (securityError) return securityError;

  // 2. Validation
  const validation = await validateBody(req, LawDownloadSchema);
  if (!validation.success) return validation.error;

  const { lawName } = validation.data;

  const envOc = process.env.NATIONAL_LAW_API_KEY || "";
  const apiKey = getNationalLawApiKey();
  const trimmedApiKey = apiKey.trim();
  const hasWhitespace = /\s/.test(apiKey);
  const hasNonAscii = /[^\x20-\x7E]/.test(apiKey);
  const charCodes = Array.from(trimmedApiKey).map((ch) => ch.charCodeAt(0));
  const [lawProbe, precProbe, admrulProbe] = await Promise.all([
    probeTargetAccess(trimmedApiKey, "law"),
    probeTargetAccess(trimmedApiKey, "prec"),
    probeTargetAccess(trimmedApiKey, "admrul"),
  ]);

  const debugInfo = {
    usedOcMasked: maskSecret(trimmedApiKey),
    ocLength: trimmedApiKey.length,
    ocSource: envOc ? "env" : "settings",
    trimmedChanged: apiKey !== trimmedApiKey,
    hasWhitespace,
    hasNonAscii,
    charCodes,
    ocHash12: sha256Short(trimmedApiKey),
    probes: [lawProbe, precProbe, admrulProbe],
  };

  if (!trimmedApiKey) {
    return NextResponse.json({ error: "국가법령정보센터 API 키가 설정되지 않았습니다.", debug: debugInfo }, { status: 400 });
  }

  const trimmedLawName = lawName.trim();
  // LawName Check is now handled by Zod, but extra trim check is fine

  try {
    const [precResult, admrulResult] = await Promise.all([
      searchAllItems("prec", trimmedLawName, trimmedApiKey),
      searchAllItems("admrul", trimmedLawName, trimmedApiKey),
    ]);

    const precedentCandidates = precResult.items;
    const admrulCandidates = admrulResult.items;

    const baseDir = path.join(process.cwd(), "law-data", sanitizeForFilename(trimmedLawName));
    const precedentDir = path.join(baseDir, "precedents");
    const admrulDir = path.join(baseDir, "administrative-rulings");
    await fs.mkdir(precedentDir, { recursive: true });
    await fs.mkdir(admrulDir, { recursive: true });

    const savedFiles: SavedFile[] = [];

    // Helper for concurrency control
    const processItems = async <T extends SearchItem>(
      items: T[],
      target: SearchTarget,
      dir: string,
      category: "precedent" | "administrative_ruling",
      summarizeFn: (xml: string) => string
    ) => {
      const CONCURRENCY_LIMIT = 5;
      const results: SavedFile[] = [];

      for (let i = 0; i < items.length; i += CONCURRENCY_LIMIT) {
        const chunk = items.slice(i, i + CONCURRENCY_LIMIT);
        const chunkResults = await Promise.all(
          chunk.map(async (item) => {
            try {
              const detailXml = await fetchDetailXml(target, item.id, trimmedApiKey);
              if (!hasLawCitation(detailXml, trimmedLawName)) return null;

              let bodyParts: string[] = [];
              if (target === "prec") {
                const caseNumber = extractFirstTagValue(detailXml, ["사건번호"]);
                const judgeDate = extractFirstTagValue(detailXml, ["선고일자"]);
                const citation = extractFirstTagValue(detailXml, ["참조조문", "참조법령"]);
                const summary = summarizeFn(detailXml);
                bodyParts = [
                  "자료유형: 판례",
                  `법령명: ${trimmedLawName}`,
                  `판례일련번호: ${item.id}`,
                  `사건명: ${item.title}`,
                  caseNumber ? `사건번호: ${caseNumber}` : "",
                  judgeDate ? `선고일자: ${judgeDate}` : "",
                  citation ? `참조법령/조문: ${citation}` : "",
                  "",
                  summary,
                ];
              } else {
                const issueNumber = extractFirstTagValue(detailXml, ["안건번호", "문서번호", "회시번호"]);
                const answerDate = extractFirstTagValue(detailXml, ["회시일자", "작성일자"]);
                const citation = extractFirstTagValue(detailXml, ["참조법령", "근거법령", "관련법령"]);
                const summary = summarizeFn(detailXml);
                bodyParts = [
                  "자료유형: 행정해석",
                  `법령명: ${trimmedLawName}`,
                  `일련번호: ${item.id}`,
                  `제목: ${item.title}`,
                  issueNumber ? `안건번호/문서번호: ${issueNumber}` : "",
                  answerDate ? `회시일자: ${answerDate}` : "",
                  citation ? `참조법령: ${citation}` : "",
                  "",
                  summary,
                ];
              }

              const fileName = `${sanitizeForFilename(item.id)}_${sanitizeForFilename(item.title)}.txt`;
              const filePath = path.join(dir, fileName);
              const body = bodyParts.filter(Boolean).join("\n");

              await fs.writeFile(filePath, body, "utf-8");
              return {
                category,
                id: item.id,
                title: item.title,
                path: path.relative(process.cwd(), filePath),
              };
            } catch (err) {
              console.error(`Failed to process ${target} ${item.id}:`, err);
              return null;
            }
          })
        );
        results.push(...chunkResults.filter((r): r is SavedFile => r !== null));
      }
      return results;
    };

    const [precSaved, admrulSaved] = await Promise.all([
      processItems(precedentCandidates, "prec", precedentDir, "precedent", summarizePrecedent),
      processItems(admrulCandidates, "admrul", admrulDir, "administrative_ruling", summarizeAdmrul)
    ]);

    savedFiles.push(...precSaved, ...admrulSaved);

    const precedentSaved = savedFiles.filter((f) => f.category === "precedent").length;
    const admrulSavedCount = savedFiles.filter((f) => f.category === "administrative_ruling").length;

    return NextResponse.json({
      success: true,
      lawName: trimmedLawName,
      totalPrecedentCandidates: precedentCandidates.length,
      totalAdmrulCandidates: admrulCandidates.length,
      totalPrecedentsSaved: precedentSaved,
      totalAdmrulsSaved: admrulSavedCount,
      totalSaved: savedFiles.length,
      truncated: precResult.truncated || admrulResult.truncated,
      savedFiles,
      debug: debugInfo,
    });
  } catch (error) {
    console.error("Reference material download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "자료 다운로드 중 오류가 발생했습니다.", debug: debugInfo },
      { status: 500 }
    );
  }
}
