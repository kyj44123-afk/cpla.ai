import { NextResponse } from "next/server";
import { getNationalLawApiKey } from "@/lib/settings";

const LAW_API_BASE = "https://www.law.go.kr/DRF";
const MAX_PER_GROUP = 10;

type SearchTarget = "prec" | "admrul";
type GroupKey = "supreme" | "high" | "district" | "interpretation" | "guidance";

interface QueryFilters {
  supreme: boolean;
  high: boolean;
  district: boolean;
  interpretation: boolean;
  guidance: boolean;
}

interface SearchItem {
  id: string;
  title: string;
  target: SearchTarget;
  court?: string;
  caseNumber?: string;
  date?: string;
  summary?: string;
  group: GroupKey[];
  score: number;
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

function extractHtmlErrorMessage(body: string): string {
  const normalized = body.replace(/\s+/g, " ").trim();
  if (!/<html[\s>]/i.test(normalized) && !/^<!doctype html/i.test(normalized)) return "";

  const h2Match = normalized.match(/<h2[^>]*>(.*?)<\/h2>/i);
  const h2Text = h2Match ? stripTagContent(h2Match[1]) : "";

  if (normalized.includes("미신청된 목록/본문에 대한 접근")) {
    return "국가법령정보센터 DRF 권한이 적용되지 않았습니다. OC의 판례/행정해석 목록·본문 권한을 확인해 주세요.";
  }
  return h2Text || "국가법령정보센터가 HTML 오류 페이지를 반환했습니다.";
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function scoreRelevance(keyword: string, title: string, summary = "", extra = ""): number {
  const nKeyword = normalize(keyword);
  const nTitle = normalize(title);
  const nSummary = normalize(summary);
  const nExtra = normalize(extra);

  let score = 0;
  if (nTitle === nKeyword) score += 200;
  if (nTitle.includes(nKeyword)) score += 120;
  if (nSummary.includes(nKeyword)) score += 50;
  if (nExtra.includes(nKeyword)) score += 20;
  return score;
}

function parsePrecedentItems(xml: string, keyword: string): SearchItem[] {
  const blocks = xml.match(/<prec[\s\S]*?<\/prec>/g) || [];
  const results: SearchItem[] = [];
  for (const block of blocks) {
    const id = extractFirstTagValue(block, ["판례일련번호", "판례정보일련번호"]);
    const title = extractFirstTagValue(block, ["사건명", "판례명", "제목"]);
    if (!id || !title) continue;

    const court = extractFirstTagValue(block, ["법원명"]);
    const caseNumber = extractFirstTagValue(block, ["사건번호"]);
    const date = extractFirstTagValue(block, ["선고일자"]);
    const summary = extractFirstTagValue(block, ["판결요지", "판시사항"]);
    const groups: GroupKey[] = [];

    if (court.includes("대법원")) groups.push("supreme");
    if (court.includes("고등")) groups.push("high");
    if (court.includes("지방법원") || court.includes("지법")) groups.push("district");

    const score = scoreRelevance(keyword, title, summary, `${court} ${caseNumber}`);
    results.push({
      id,
      title,
      target: "prec",
      court,
      caseNumber,
      date,
      summary,
      group: groups,
      score,
    });
  }
  return results;
}

function parseAdmrulItems(xml: string, keyword: string): SearchItem[] {
  const blocks = xml.match(/<admrul[\s\S]*?<\/admrul>/g) || [];
  const results: SearchItem[] = [];
  for (const block of blocks) {
    const id = extractFirstTagValue(block, ["행정해석일련번호", "유권해석일련번호", "법령해석례일련번호", "행정규칙일련번호"]);
    const title = extractFirstTagValue(block, ["안건명", "제목", "건명", "해석례명"]);
    if (!id || !title) continue;

    const agency = extractFirstTagValue(block, ["소관부처명", "부서명"]);
    const date = extractFirstTagValue(block, ["회시일자", "작성일자"]);
    const summary = extractFirstTagValue(block, ["요지", "내용", "회답", "질의요지"]);
    const guidanceKeywords = ["지침", "고시", "훈령", "예규", "가이드", "매뉴얼"];
    const guidanceHit = guidanceKeywords.some((k) => `${title} ${summary}`.includes(k));
    const groups: GroupKey[] = ["interpretation"];
    if (guidanceHit) groups.push("guidance");

    const score = scoreRelevance(keyword, title, summary, agency);
    results.push({
      id,
      title,
      target: "admrul",
      date,
      summary,
      group: groups,
      score,
    });
  }
  return results;
}

async function searchTarget(apiKey: string, target: SearchTarget, query: string): Promise<string> {
  const url = new URL(`${LAW_API_BASE}/lawSearch.do`);
  url.searchParams.set("OC", apiKey);
  url.searchParams.set("target", target);
  url.searchParams.set("type", "XML");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "100");
  url.searchParams.set("page", "1");
  if (target === "prec") url.searchParams.set("search", "1");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`${target} 검색 실패 (status=${res.status})`);

  const body = await decodeXmlResponse(res);
  const htmlError = extractHtmlErrorMessage(body);
  if (htmlError) throw new Error(htmlError);
  return body;
}

function pickTopByGroup(items: SearchItem[], group: GroupKey): SearchItem[] {
  return items
    .filter((item) => item.group.includes(group))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PER_GROUP);
}

export async function POST(req: Request) {
  try {
    const apiKey = getNationalLawApiKey().trim();
    if (!apiKey) {
      return NextResponse.json({ error: "국가법령정보센터 OC가 설정되지 않았습니다." }, { status: 400 });
    }

    const body = await req.json();
    const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    const filters: QueryFilters = {
      supreme: Boolean(body?.filters?.supreme),
      high: Boolean(body?.filters?.high),
      district: Boolean(body?.filters?.district),
      interpretation: Boolean(body?.filters?.interpretation),
      guidance: Boolean(body?.filters?.guidance),
    };

    if (!keyword) {
      return NextResponse.json({ error: "검색 키워드를 입력해 주세요." }, { status: 400 });
    }

    const [precXml, admrulXml, guidanceXml] = await Promise.all([
      searchTarget(apiKey, "prec", keyword),
      searchTarget(apiKey, "admrul", keyword),
      searchTarget(apiKey, "admrul", `${keyword} 지침`),
    ]);

    const precedentItems = parsePrecedentItems(precXml, keyword);
    const interpretationItems = parseAdmrulItems(admrulXml, keyword);
    const guidanceItems = parseAdmrulItems(guidanceXml, keyword);

    const mergedAdmrul = new Map<string, SearchItem>();
    [...interpretationItems, ...guidanceItems].forEach((item) => {
      const existing = mergedAdmrul.get(item.id);
      if (!existing) {
        mergedAdmrul.set(item.id, item);
        return;
      }
      const groups = Array.from(new Set([...existing.group, ...item.group]));
      mergedAdmrul.set(item.id, { ...existing, group: groups, score: Math.max(existing.score, item.score) });
    });

    const allItems = [...precedentItems, ...Array.from(mergedAdmrul.values())];
    const groups: Record<GroupKey, SearchItem[]> = {
      supreme: filters.supreme ? pickTopByGroup(allItems, "supreme") : [],
      high: filters.high ? pickTopByGroup(allItems, "high") : [],
      district: filters.district ? pickTopByGroup(allItems, "district") : [],
      interpretation: filters.interpretation ? pickTopByGroup(allItems, "interpretation") : [],
      guidance: filters.guidance ? pickTopByGroup(allItems, "guidance") : [],
    };

    const total = Object.values(groups).reduce((sum, list) => sum + list.length, 0);

    return NextResponse.json({
      keyword,
      total,
      groups,
    });
  } catch (error) {
    console.error("My Elabor search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
