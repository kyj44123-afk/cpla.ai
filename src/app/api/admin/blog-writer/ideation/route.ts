
import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { withSecurity, validateBody } from "@/lib/api-security";
import { BlogIdeationSchema, SYSTEM_PROMPT_IDEATION } from "@/lib/blog-prompts";

export const runtime = "nodejs";

type IdeationPayload = {
    titles: string[];
    outline: Array<{ heading: string; description: string }>;
};

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeIdeation(raw: unknown, keyword: string): IdeationPayload {
    const row = (raw ?? {}) as Record<string, unknown>;
    const titles = Array.isArray(row.titles)
        ? row.titles.map((v) => normalizeText(v)).filter(Boolean).slice(0, 6)
        : [];

    const outline = Array.isArray(row.outline)
        ? row.outline
            .map((item) => {
                const o = item as Record<string, unknown>;
                const heading = normalizeText(o.heading);
                if (!heading) return null;
                return {
                    heading,
                    description: normalizeText(o.description),
                };
            })
            .filter((x): x is { heading: string; description: string } => x !== null)
            .slice(0, 8)
        : [];

    const fallbackTitles = [
        `${keyword} 핵심 정리: 실무에서 바로 쓰는 가이드`,
        `${keyword} 대응 방법: 놓치기 쉬운 포인트 7가지`,
        `${keyword} 실제 적용 순서: 초보자도 이해하는 체크리스트`,
    ];

    const fallbackOutline = [
        { heading: "문제 정의와 핵심 쟁점", description: `${keyword} 이슈에서 가장 먼저 확인할 기준` },
        { heading: "실무 대응 절차", description: "단계별로 바로 실행 가능한 대응 방식" },
        { heading: "자주 발생하는 실수와 예방법", description: "분쟁을 키우는 패턴과 예방 포인트" },
        { heading: "요약 및 다음 액션", description: "바로 실행할 체크리스트" },
    ];

    return {
        titles: titles.length > 0 ? titles : fallbackTitles,
        outline: outline.length > 0 ? outline : fallbackOutline,
    };
}

export async function POST(req: NextRequest) {
    // 1. Security Check
    const securityError = await withSecurity(req, { checkAuth: true, rateLimit: { limit: 10, windowMs: 60000 } });
    if (securityError) return securityError;

    // 2. Validation
    const validation = await validateBody(req, BlogIdeationSchema);
    if (!validation.success) return validation.error;

    const { keyword, preset } = validation.data;

    try {
        const openai = getOpenAI();

        // Using gpt-4o for better ideation capability
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" },
            temperature: 0.8,
            messages: [
                {
                    role: "system",
                    content: SYSTEM_PROMPT_IDEATION,
                },
                {
                    role: "user",
                    content: `키워드: ${keyword}\n프리셋(참고용): ${preset || "일반"}`,
                },
            ],
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content generated");
        }

        const result = JSON.parse(content);
        const normalized = normalizeIdeation(result, keyword);
        return NextResponse.json(normalized);

    } catch (error) {
        console.error("Blog Ideation Error:", error);
        return NextResponse.json(
            { error: "아이디어 생성 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
