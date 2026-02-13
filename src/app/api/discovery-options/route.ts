import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { mapKeywords } from "@/lib/keywordMapper";
import { searchNationalLaw } from "@/lib/nationalLaw";

type Body = {
  situation: string;
  selectedPath: string[];
  round: number;
};

type DiscoveryPayload = {
  question: string;
  options: string[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const situation = body.situation?.trim();
    const selectedPath = Array.isArray(body.selectedPath) ? body.selectedPath : [];
    const round = Number(body.round || 1);

    if (!situation) {
      return NextResponse.json({ error: "Missing situation" }, { status: 400 });
    }

    const openai = getOpenAI();
    let lawContext = "";

    try {
      const refined = mapKeywords(situation, { primary: "", secondary: "" });
      if (refined.primary) {
        const laws = await searchNationalLaw(refined.primary);
        lawContext = laws
          .slice(0, 2)
          .map((law) => `${law.title}: ${law.content.slice(0, 220)}`)
          .join("\n");
      }
    } catch {
      lawContext = "";
    }

    const isFinalRound = round >= 2;

    const systemPrompt = isFinalRound
      ? `당신은 노무법인 서비스 라우터입니다.
사용자가 직전 단계에서 밝힌 목적을 바탕으로 마지막 3단계 질문을 만드세요.

목표:
1) 질문은 정확히 1개만 작성한다.
2) 질문 앞부분에 "현재 목적을 충족하기 위한 절차"를 1문장으로 간략히 안내한다.
3) 그 뒤에 반드시 "전문가인 공인노무사에게 어떤 도움을 받고 싶나요?"라는 취지의 질문으로 마무리한다.
4) 선택지는 질문형이 아니라, 실제 서비스 선택지 3개를 제시한다.

선택지 원칙:
- 노무법인이 바로 제공 가능한 서비스명으로 작성한다.
- 서로 중복되지 않게 작성한다.
- 너무 포괄적인 문구는 피한다.

반드시 JSON만 반환:
{
  "question": "...",
  "options": ["...", "...", "..."]
}`
      : `당신은 노무 이슈 탐색용 2단계 질문 설계자입니다.
사용자의 1단계 입력을 바탕으로 다음 질문을 설계하세요.

목표:
1) 질문은 정확히 1개만 작성한다.
2) 질문 시작에서 핵심 목적을 한 개 키워드로 제시한다. 예: "임금체불", "부당해고", "직장내괴롭힘"
3) 키워드의 의미를 1문장으로 짧게 설명한다.
4) 이어서 구체 상황을 묻는 질문을 붙인다.
5) 질문은 단순한 재질문이 아니라 서비스 분기 판단에 도움이 되는 내용이어야 한다.

선택지 원칙:
- 질문에 답할 수 있는 구체 상황 선택지 3개를 만든다.
- 선택지는 짧고 명확한 진술문으로 작성한다.
- 서로 배타적으로 작성해 분기 정확도를 높인다.

반드시 JSON만 반환:
{
  "question": "...",
  "options": ["...", "...", "..."]
}`;

    const userPrompt = `원문 상황: ${situation}
이전 선택 경로: ${selectedPath.join(" > ") || "없음"}
현재 라운드: ${round}
참고 법령 맥락(있으면 사용): ${lawContext || "없음"}
반드시 한국어로 작성`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}") as Partial<DiscoveryPayload>;
    const question = typeof parsed.question === "string" ? parsed.question.trim() : "";
    const options = Array.isArray(parsed.options)
      ? parsed.options
          .filter((v: unknown) => typeof v === "string")
          .map((v) => v.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (!question || options.length !== 3) {
      const fallbackQuestion = isFinalRound
        ? "현재 상황은 사실관계를 확인하고 대응 절차를 정리하면 해결 가능성이 높습니다. 전문가인 공인노무사에게 어떤 도움을 받고 싶나요?"
        : "핵심 키워드는 임금체불입니다. 임금체불은 지급일이 지난 임금이나 수당을 받지 못한 상태를 의미합니다. 현재 어떤 상황에 가장 가깝나요?";
      const fallbackOptions = isFinalRound
        ? ["임금체불 진정사건 대리", "대지급금 신청 대리", "전문 공인노무사 상담"]
        : [
            "지급일이 지났는데 임금이 전혀 지급되지 않았어요",
            "일부만 지급되고 나머지가 계속 미지급 상태예요",
            "퇴사 후 정산금(임금·수당·퇴직금)이 남아 있어요",
          ];
      return NextResponse.json({ question: fallbackQuestion, options: fallbackOptions, isFinalRound });
    }

    return NextResponse.json({ question, options, isFinalRound });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate options" }, { status: 500 });
  }
}
