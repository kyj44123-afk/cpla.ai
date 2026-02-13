
import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { withSecurity, validateBody } from "@/lib/api-security";
import { BlogIdeationSchema, SYSTEM_PROMPT_IDEATION } from "@/lib/blog-prompts";

export const runtime = "nodejs";

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
        return NextResponse.json(result);

    } catch (error) {
        console.error("Blog Ideation Error:", error);
        return NextResponse.json(
            { error: "아이디어 생성 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
