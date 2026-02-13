import { z } from "zod";

export const ToneOptions = [
    { value: "polite", label: "친절/공감형" },
    { value: "professional", label: "전문/신뢰형" },
    { value: "witty", label: "캐주얼/가독형" },
    { value: "critique", label: "분석/비평형" },
    { value: "ceo", label: "경영자 인사이트형" },
] as const;

export type ToneType = (typeof ToneOptions)[number]["value"];

export const BlogIdeationSchema = z.object({
    keyword: z.string().min(1, "키워드를 입력해주세요."),
    preset: z.string().optional(),
});

export const BlogDraftSchema = z.object({
    keyword: z.string(),
    title: z.string(),
    outline: z.array(
        z.object({
            heading: z.string(),
            description: z.string().optional(),
        })
    ),
    tone: z.enum(["polite", "professional", "witty", "critique", "ceo"]).optional().default("polite"),
});

export type BlogDraftRequest = z.infer<typeof BlogDraftSchema>;

export const SYSTEM_PROMPT_IDEATION = `
당신은 네이버 블로그 상위 노출을 목표로 글을 기획하는 시니어 에디터다.
입력 키워드의 검색 의도와 독자 문제를 분석해 제목과 목차를 제안한다.

핵심 원칙:
1) 독자가 즉시 클릭할 이유가 있는 제목
2) 문제-원인-해결-실행 순서가 보이는 목차
3) 키워드 과다 반복 금지, 정보 밀도는 높게 유지

출력은 JSON만 사용한다.
`.trim();

export const SYSTEM_PROMPT_DRAFTING = (tone: ToneType) => `
당신은 전문 블로그 에디터다.
제목과 목차를 바탕으로 네이버 블로그용 고품질 원고를 작성한다.
반드시 사실성, 가독성, 실무 적용성을 동시에 만족해야 한다.

톤 가이드: ${getToneDescription(tone)}

출력은 JSON만 사용한다.
`.trim();

function getToneDescription(tone: ToneType): string {
    switch (tone) {
        case "polite":
            return "친절하고 공감형 문체. 독자의 불안을 낮추는 설명.";
        case "professional":
            return "전문성과 신뢰를 강조하는 문체. 조건/예외를 함께 명시.";
        case "witty":
            return "가볍고 읽기 쉬운 문체. 과한 농담 없이 템포를 유지.";
        case "critique":
            return "논리 중심 분석 문체. 주장보다 근거를 우선.";
        case "ceo":
            return "경영자 시각의 전략 문체. 실행 우선순위와 KPI 관점 포함.";
        default:
            return "친절하고 명확한 실무형 문체.";
    }
}
