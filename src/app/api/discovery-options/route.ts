import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { mapKeywords } from "@/lib/keywordMapper";
import { searchNationalLaw } from "@/lib/nationalLaw";

type Body = {
  situation: string;
  selectedPath: string[];
  round: number;
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
        lawContext = laws.slice(0, 2).map((law) => `${law.title}: ${law.content.slice(0, 220)}`).join("\n");
      }
    } catch {
      lawContext = "";
    }

    const isFinalRound = round >= 3;

    const systemPrompt = isFinalRound
      ? `당신은 노무법인 서비스 라우터입니다.
사용자 입력을 바탕으로 최종 서비스 선택지 3개를 만듭니다.
반드시 한국어 문장 3개만 제시하세요.
절대 판단/설명/사유를 쓰지 말고, 서비스명만 제시하세요.
예시 형식:
1) 임금체불 진정사건 대리
2) 대지급금 신청 대리
3) 전문 공인노무사 상담`
      : `당신은 노무 이슈 분류용 질문 생성기입니다.
사용자 상황을 해석해 다음 단계의 선택지 3개를 만듭니다.
반드시 한국어 질문형 선택지 3개만 제시하세요.
절대 판단/설명/사유를 쓰지 말고, 선택 문장만 제시하세요.
예시 형식:
1) 월급이 밀렸나요?
2) 임금 계산이 잘못되었나요?
3) 회사가 도산·파산했나요?`;

    const userPrompt = `원문 상황: ${situation}
이미 선택한 경로: ${selectedPath.join(" > ") || "없음"}
현재 라운드: ${round}
참고 법령 맥락(있으면 활용): ${lawContext || "없음"}

JSON 형식으로만 응답하세요:
{ "options": ["...", "...", "..."] }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    const options = Array.isArray(parsed.options)
      ? parsed.options.filter((v: unknown) => typeof v === "string").slice(0, 3)
      : [];

    if (options.length !== 3) {
      const fallback = isFinalRound
        ? ["임금체불 진정사건 대리", "대지급금 신청 대리", "전문 공인노무사 상담"]
        : ["문제가 발생한 시점이 최근인가요?", "회사와 이미 협의해보셨나요?", "서면 증빙자료를 보유하고 있나요?"];
      return NextResponse.json({ options: fallback, isFinalRound });
    }

    return NextResponse.json({ options, isFinalRound });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate options" }, { status: 500 });
  }
}
