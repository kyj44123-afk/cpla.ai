import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getNationalLawApiKey } from "@/lib/settings";

export const runtime = "nodejs";

const LAW_API_BASE = "https://www.law.go.kr/DRF";

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

function normalizeArticleNumber(input: string): string {
  return input.replace(/[^0-9]/g, "");
}

function parseRequestedArticles(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => normalizeArticleNumber(item))
    .filter(Boolean);
}

function sanitizeForFilename(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

interface LawSearchItem {
  id: string;
  title: string;
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

function parseLawSearchResults(xml: string): LawSearchItem[] {
  const items = xml.match(/<law[\s\S]*?<\/law>/g) || [];
  return items
    .map((item) => {
      const id = extractFirstTagValue(item, ["법령ID", "법령일련번호", "법령일련번호ID"]);
      const title = extractFirstTagValue(item, ["법령명한글", "법령명_한글", "법령명"]);
      return { id, title };
    })
    .filter((item) => Boolean(item.id && item.title));
}

function parseLawArticles(xml: string) {
  const articleBlocks = xml.match(/<조문단위[\s\S]*?<\/조문단위>/g) || [];

  return articleBlocks
    .map((block) => {
      const articleNumberLabel = extractFirstTagValue(block, ["조문번호", "조문번호한글"]);
      const articleTitle = extractFirstTagValue(block, ["조문제목", "조문명"]);
      const articleContent = extractFirstTagValue(block, ["조문내용"]);
      return {
        articleNumberLabel,
        articleTitle,
        articleContent,
        articleNumberNormalized: normalizeArticleNumber(articleNumberLabel),
      };
    })
    .filter((article) => article.articleNumberLabel && article.articleContent);
}

export async function POST(req: Request) {
  const apiKey = getNationalLawApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "국가법령정보센터 API 키가 설정되지 않았습니다." }, { status: 400 });
  }

  const { lawName, articleNumbers } = await req.json();

  if (!lawName || typeof lawName !== "string") {
    return NextResponse.json({ error: "법령명을 입력해 주세요." }, { status: 400 });
  }

  if (articleNumbers !== undefined && articleNumbers !== null && typeof articleNumbers !== "string") {
    return NextResponse.json({ error: "조문 번호를 쉼표로 구분해 입력해 주세요." }, { status: 400 });
  }

  const requestedArticles = parseRequestedArticles(typeof articleNumbers === "string" ? articleNumbers : "");
  const downloadAllArticles = requestedArticles.length === 0;

  try {
    const searchUrl = new URL(`${LAW_API_BASE}/lawSearch.do`);
    searchUrl.searchParams.set("OC", apiKey);
    searchUrl.searchParams.set("target", "law");
    searchUrl.searchParams.set("type", "XML");
    searchUrl.searchParams.set("query", lawName.trim());
    searchUrl.searchParams.set("display", "20");

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      return NextResponse.json({ error: "법령 검색에 실패했습니다." }, { status: 502 });
    }

    const searchXml = await decodeXmlResponse(searchRes);
    const searchError = extractApiError(searchXml);
    if (searchError) {
      return NextResponse.json({ error: `국가법령정보센터 검색 오류: ${searchError}` }, { status: 502 });
    }

    const searchItems = parseLawSearchResults(searchXml);
    const normalizedLawName = lawName.replace(/\s+/g, "");
    const selectedLaw =
      searchItems.find((item) => item.title.replace(/\s+/g, "") === normalizedLawName) ||
      searchItems.find((item) => item.title.includes(lawName.trim())) ||
      searchItems[0];

    if (!selectedLaw) {
      return NextResponse.json(
        {
          error: "해당 법령을 찾을 수 없습니다.",
          debug: {
            query: lawName.trim(),
            totalSearchItems: searchItems.length,
          },
        },
        { status: 404 }
      );
    }

    const detailUrl = new URL(`${LAW_API_BASE}/lawService.do`);
    detailUrl.searchParams.set("OC", apiKey);
    detailUrl.searchParams.set("target", "law");
    detailUrl.searchParams.set("ID", selectedLaw.id);
    detailUrl.searchParams.set("type", "XML");

    const detailRes = await fetch(detailUrl.toString());
    if (!detailRes.ok) {
      return NextResponse.json({ error: "법령 상세 조회에 실패했습니다." }, { status: 502 });
    }

    const detailXml = await decodeXmlResponse(detailRes);
    const detailError = extractApiError(detailXml);
    if (detailError) {
      return NextResponse.json({ error: `국가법령정보센터 상세 조회 오류: ${detailError}` }, { status: 502 });
    }

    const lawTitle =
      extractFirstTagValue(detailXml, ["법령명_한글", "법령명한글"]) ||
      selectedLaw.title;

    const articles = parseLawArticles(detailXml);
    const matchedArticles = downloadAllArticles
      ? articles
      : articles.filter((article) => requestedArticles.includes(article.articleNumberNormalized));

    if (matchedArticles.length === 0) {
      if (downloadAllArticles) {
        return NextResponse.json({ error: "해당 법령에서 저장할 조문을 찾지 못했습니다." }, { status: 404 });
      }
      return NextResponse.json({ error: "요청하신 조문을 찾지 못했습니다." }, { status: 404 });
    }

    const baseDir = path.join(process.cwd(), "law-data", sanitizeForFilename(lawTitle));
    await fs.mkdir(baseDir, { recursive: true });

    const savedFiles = await Promise.all(
      matchedArticles.map(async (article) => {
        const fileName = `${sanitizeForFilename(lawTitle)}_${sanitizeForFilename(article.articleNumberLabel)}.txt`;
        const filePath = path.join(baseDir, fileName);
        const body = [
          `법령명: ${lawTitle}`,
          `조문: ${article.articleNumberLabel}`,
          article.articleTitle ? `조문제목: ${article.articleTitle}` : "",
          "",
          article.articleContent,
        ]
          .filter(Boolean)
          .join("\n");

        await fs.writeFile(filePath, body, "utf-8");

        return {
          article: article.articleNumberLabel,
          title: article.articleTitle,
          path: path.relative(process.cwd(), filePath),
        };
      })
    );

    return NextResponse.json({
      success: true,
      lawTitle,
      totalRequested: downloadAllArticles ? matchedArticles.length : requestedArticles.length,
      downloadedAllArticles: downloadAllArticles,
      totalSaved: savedFiles.length,
      savedFiles,
    });
  } catch (error) {
    console.error("Law download error:", error);
    return NextResponse.json({ error: "법령 다운로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
