import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withSecurity, validateBody } from "@/lib/api-security";
import { getOpenAI } from "@/lib/openai";

const ResearchSchema = z.object({
    keyword: z.string().min(1, "키워드를 입력해주세요."),
    styleSample: z.string().optional(),
    topicCount: z.number().int().min(100).max(1000).optional(),
    sampleKeywordCount: z.number().int().min(3).max(20).optional(),
});

type TopicRow = {
    keyword: string;
    intent: string;
    angle: string;
    persona: string;
};

type StyleBlueprint = {
    voiceRules: string[];
    expertiseSignals: string[];
    forbiddenPatterns: string[];
    naverExposurePlaybook: string[];
    qualityChecklist: string[];
};

function normalizeText(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

function normalizeTopicRows(value: unknown): TopicRow[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((item) => {
            const row = item as Record<string, unknown>;
            const keyword = normalizeText(row.keyword);
            if (!keyword) return null;
            return {
                keyword,
                intent: normalizeText(row.intent),
                angle: normalizeText(row.angle),
                persona: normalizeText(row.persona),
            };
        })
        .filter((item): item is TopicRow => item !== null);
}

async function generateTopicBatch(params: {
    rootKeyword: string;
    already: string[];
    batchSize: number;
}): Promise<TopicRow[]> {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: [
                    "당신은 네이버 블로그 SEO 전략가이자 주제 기획자다.",
                    "요청 키워드를 중심으로 실제 검색의도가 분명한 블로그 주제를 생성한다.",
                    "중복 없이 롱테일 키워드를 만들고, 각 주제는 글 1편 분량으로 충분히 구체적이어야 한다.",
                    "응답은 JSON만 출력한다.",
                ].join("\n"),
            },
            {
                role: "user",
                content: [
                    `루트 키워드: ${params.rootKeyword}`,
                    `생성 개수: ${params.batchSize}`,
                    `이미 생성된 키워드(중복 금지): ${params.already.slice(-150).join(" | ") || "없음"}`,
                    '출력 스키마: { "topics": [ { "keyword": "", "intent": "", "angle": "", "persona": "" } ] }',
                    "규칙:",
                    "- 정보형/비교형/문제해결형/사례형 의도를 균형 있게 섞는다.",
                    "- 제목성 문장이 아니라 검색 키워드 형태로 작성한다.",
                    "- 한국어로 작성한다.",
                ].join("\n"),
            },
        ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeTopicRows(parsed.topics);
}

function pickSeedKeywords(rootKeyword: string, topics: TopicRow[], count: number): string[] {
    const result: string[] = [rootKeyword];
    for (const row of topics) {
        if (result.length >= count) break;
        if (!result.includes(row.keyword)) result.push(row.keyword);
    }
    return result.slice(0, count);
}

function normalizeStyleBlueprint(value: unknown): StyleBlueprint {
    const row = (value ?? {}) as Record<string, unknown>;
    const toArray = (v: unknown, max = 12) =>
        Array.isArray(v)
            ? v.map((x) => normalizeText(x)).filter(Boolean).slice(0, max)
            : [];
    return {
        voiceRules: toArray(row.voiceRules, 12),
        expertiseSignals: toArray(row.expertiseSignals, 12),
        forbiddenPatterns: toArray(row.forbiddenPatterns, 12),
        naverExposurePlaybook: toArray(row.naverExposurePlaybook, 15),
        qualityChecklist: toArray(row.qualityChecklist, 20),
    };
}

async function analyzeStyleAndExposure(params: {
    rootKeyword: string;
    styleSample: string;
    sampledPosts: Array<{
        keyword: string;
        title: string;
        description: string;
        bloggerName: string;
        link: string;
        postDate: string;
    }>;
}): Promise<StyleBlueprint> {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: [
                    "당신은 네이버 블로그 상위노출 분석가이자 전문 에디터다.",
                    "샘플 글 문체를 복제하지 않고 강점만 추출해 재현 가능한 스타일 규칙으로 만든다.",
                    "네이버 상위 포스트 샘플을 분석해 구조/제목/훅/체류시간 관점의 실행 전략을 도출한다.",
                    "응답은 JSON만 출력한다.",
                ].join("\n"),
            },
            {
                role: "user",
                content: [
                    `핵심 키워드: ${params.rootKeyword}`,
                    `사용자 샘플 문체:\n${params.styleSample || "샘플 미입력"}`,
                    `네이버 샘플 포스트(${params.sampledPosts.length}개): ${JSON.stringify(params.sampledPosts.slice(0, 40))}`,
                    '출력 스키마: { "voiceRules": [""], "expertiseSignals": [""], "forbiddenPatterns": [""], "naverExposurePlaybook": [""], "qualityChecklist": [""] }',
                    "조건:",
                    "- 실행 가능한 규칙형 문장으로 작성",
                    "- 추상어 대신 점검 가능한 문장으로 작성",
                    "- 과장/허위/낚시성 표현 금지",
                ].join("\n"),
            },
        ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeStyleBlueprint(parsed);
}

export async function POST(req: NextRequest) {
    const securityError = await withSecurity(req, { checkAuth: true, rateLimit: { limit: 2, windowMs: 60000 } });
    if (securityError) return securityError;

    const validation = await validateBody(req, ResearchSchema);
    if (!validation.success) return validation.error;

    const { keyword, styleSample } = validation.data;
    const topicCount = validation.data.topicCount ?? 1000;
    const sampleKeywordCount = validation.data.sampleKeywordCount ?? 10;

    try {
        const dedupe = new Set<string>();
        const topicRows: TopicRow[] = [];
        let attempts = 0;

        while (topicRows.length < topicCount && attempts < 12) {
            attempts += 1;
            const remain = topicCount - topicRows.length;
            const batchSize = Math.min(200, remain);
            const batch = await generateTopicBatch({
                rootKeyword: keyword,
                already: topicRows.map((row) => row.keyword),
                batchSize,
            });

            for (const row of batch) {
                const key = row.keyword.toLowerCase();
                if (dedupe.has(key)) continue;
                dedupe.add(key);
                topicRows.push(row);
                if (topicRows.length >= topicCount) break;
            }
        }

        const seedKeywords = pickSeedKeywords(keyword, topicRows, sampleKeywordCount);
        const naverResearch = {
            available: false,
            reason: "DISABLED_FOR_NOW",
            sampledKeywords: seedKeywords,
            sampledPosts: [] as Array<{
                keyword: string;
                title: string;
                description: string;
                bloggerName: string;
                link: string;
                postDate: string;
            }>,
        };

        const styleBlueprint = await analyzeStyleAndExposure({
            rootKeyword: keyword,
            styleSample: normalizeText(styleSample),
            sampledPosts: naverResearch.sampledPosts,
        });

        return NextResponse.json({
            keyword,
            topicCountRequested: topicCount,
            topicCountGenerated: topicRows.length,
            topics: topicRows,
            naverResearch,
            styleBlueprint,
        });
    } catch (error) {
        console.error("Blog writer research error:", error);
        return NextResponse.json(
            { error: "리서치 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
            { status: 500 }
        );
    }
}
