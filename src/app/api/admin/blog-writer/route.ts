import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

type BlogSection = {
  heading: string;
  content: string;
};

type BlogImage = {
  query: string;
  alt: string;
  caption: string;
};

type BlogDraft = {
  title: string;
  intro: string;
  image: BlogImage;
  sections: BlogSection[];
  conclusion: string;
  hashtags: string[];
};

type RequestBody = {
  keyword?: string;
  tone?: string;
  length?: "short" | "medium" | "long";
};

function normalizeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim();
}

function normalizeSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const heading = normalizeText((item as Record<string, unknown>).heading);
      const content = normalizeText((item as Record<string, unknown>).content);
      if (!heading || !content) {
        return null;
      }
      return { heading, content };
    })
    .filter((item): item is BlogSection => item !== null)
    .slice(0, 5);
}

function normalizeHashtags(value: unknown, keyword: string): string[] {
  if (!Array.isArray(value)) {
    return [`#${keyword.replace(/\s+/g, "")}`];
  }

  const tags = value
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .slice(0, 10);

  if (tags.length > 0) {
    return tags;
  }

  return [`#${keyword.replace(/\s+/g, "")}`];
}

function buildMarkdown(draft: BlogDraft, imageUrl: string): string {
  const lines: string[] = [];

  lines.push(`# ${draft.title}`);
  lines.push("");
  lines.push(draft.intro);
  lines.push("");
  lines.push(`![${draft.image.alt}](${imageUrl})`);
  if (draft.image.caption) {
    lines.push(`> ${draft.image.caption}`);
  }
  lines.push("");

  for (const section of draft.sections) {
    lines.push(`## ${section.heading}`);
    lines.push("");
    lines.push(section.content);
    lines.push("");
  }

  lines.push("## 마무리");
  lines.push("");
  lines.push(draft.conclusion);
  lines.push("");
  lines.push(draft.hashtags.join(" "));

  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    const keyword = normalizeText(body.keyword);
    const tone = normalizeText(body.tone, "전문적이지만 읽기 쉬운 톤");
    const length = body.length ?? "medium";

    if (!keyword) {
      return NextResponse.json({ error: "키워드를 입력해주세요." }, { status: 400 });
    }

    const lengthGuide: Record<NonNullable<RequestBody["length"]>, string> = {
      short: "전체 분량은 600~900자 내외",
      medium: "전체 분량은 1200~1800자 내외",
      long: "전체 분량은 2200~3000자 내외",
    };

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "당신은 한국어 SEO 블로그 전문 작가입니다. 반드시 JSON만 출력하세요. " +
            "결과는 독자가 끝까지 읽도록 구성하고, 과장/허위 정보는 넣지 마세요.",
        },
        {
          role: "user",
          content: [
            `키워드: ${keyword}`,
            `톤: ${tone}`,
            `분량: ${lengthGuide[length]}`,
            "다음 JSON 스키마로 작성:",
            '{ "title": "", "intro": "", "image": { "query": "", "alt": "", "caption": "" }, "sections": [ { "heading": "", "content": "" } ], "conclusion": "", "hashtags": ["#태그"] }',
            "규칙:",
            "1) intro는 2~4문장",
            "2) sections는 3~5개",
            "3) 각 section content는 문단형으로 구체적으로 작성",
            "4) image.query는 사진 검색용 짧은 키워드(영문/국문 가능)",
            "5) 해시태그는 5~8개",
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    const sections = normalizeSections(parsed.sections);

    const draft: BlogDraft = {
      title: normalizeText(parsed.title, `${keyword} 가이드`),
      intro: normalizeText(parsed.intro, `${keyword}에 대해 꼭 알아야 할 핵심 내용을 정리했습니다.`),
      image: {
        query: normalizeText((parsed.image as Record<string, unknown>)?.query, keyword),
        alt: normalizeText((parsed.image as Record<string, unknown>)?.alt, `${keyword} 관련 이미지`),
        caption: normalizeText((parsed.image as Record<string, unknown>)?.caption, `${keyword}를 상징하는 장면`),
      },
      sections:
        sections.length > 0
          ? sections
          : [
              {
                heading: `${keyword} 핵심 정리`,
                content: `${keyword}를 처음 접하는 사람도 이해할 수 있도록 기본 개념부터 실무 팁까지 순서대로 정리하세요.`,
              },
            ],
      conclusion: normalizeText(parsed.conclusion, `${keyword} 실행 계획을 지금 바로 시작해 보세요.`),
      hashtags: normalizeHashtags(parsed.hashtags, keyword),
    };

    const imageUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(draft.image.query || keyword)}`;
    const markdown = buildMarkdown(draft, imageUrl);

    return NextResponse.json({
      draft,
      imageUrl,
      markdown,
    });
  } catch (error) {
    console.error("Blog writer error:", error);
    return NextResponse.json(
      { error: "글 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }
}

