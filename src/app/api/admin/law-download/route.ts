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

function parseLawSearchResults(xml: string): LawSearchItem[] {
  const items = xml.match(/<law[\s\S]*?<\/law>/g) || [];
  return items
    .map((item) => {
      const id = extractFirstTagValue(item, ["법령ID", "법령일련번호"]);
      const title = extractFirstTagValue(item, ["법령명한글", "법령명_한글"]);
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

  if (!articleNumbers || typeof articleNumbers !== "string") {
    return NextResponse.json({ error: "조문 번호를 쉼표로 구분해 입력해 주세요." }, { status: 400 });
  }

  const requestedArticles = parseRequestedArticles(articleNumbers);
  if (requestedArticles.length === 0) {
    return NextResponse.json({ error: "유효한 조문 번호가 없습니다." }, { status: 400 });
  }

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

    const searchXml = await searchRes.text();
    const searchItems = parseLawSearchResults(searchXml);
    const normalizedLawName = lawName.replace(/\s+/g, "");
    const selectedLaw =
      searchItems.find((item) => item.title.replace(/\s+/g, "") === normalizedLawName) ||
      searchItems.find((item) => item.title.includes(lawName.trim())) ||
      searchItems[0];

    if (!selectedLaw) {
      return NextResponse.json({ error: "해당 법령을 찾을 수 없습니다." }, { status: 404 });
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

    const detailXml = await detailRes.text();
    const lawTitle =
      extractFirstTagValue(detailXml, ["법령명_한글", "법령명한글"]) ||
      selectedLaw.title;

    const articles = parseLawArticles(detailXml);
    const matchedArticles = articles.filter((article) =>
      requestedArticles.includes(article.articleNumberNormalized)
    );

    if (matchedArticles.length === 0) {
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
      totalRequested: requestedArticles.length,
      totalSaved: savedFiles.length,
      savedFiles,
    });
  } catch (error) {
    console.error("Law download error:", error);
    return NextResponse.json({ error: "법령 다운로드 중 오류가 발생했습니다." }, { status: 500 });
  }
}
