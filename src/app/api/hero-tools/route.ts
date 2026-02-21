import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { searchPrecedent } from "@/lib/nationalLaw";

export const runtime = "nodejs";

type ToolName = "precedent-search" | "contract-diagnosis" | "fact-structure" | "quiz-generator";

type FactShape = {
  who: string;
  when: string;
  where: string;
  what_action: string;
  how: string;
  context: string;
};

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function stripCodeFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

async function extractPdfText(file: File) {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error("Only PDF files are supported.");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const mod = (await import("pdf-parse")) as unknown as {
    default?: (data: Buffer) => Promise<{ text: string }>;
    (data: Buffer): Promise<{ text: string }>;
  };
  const pdfParse = typeof mod.default === "function" ? mod.default : mod;
  const parsed = await pdfParse(buf);
  return (parsed.text ?? "").trim();
}

async function summarizePrecedents(keyword: string) {
  const precedents = await searchPrecedent(keyword);
  const top = precedents
    .filter((item) => item.caseNumber && item.content)
    .slice(0, 3)
    .map((item) => ({
      caseNumber: item.caseNumber || "",
      title: item.title,
      content: item.content.slice(0, 900),
    }));

  if (top.length === 0) {
    return [] as { caseNumber: string; summary: string }[];
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You summarize labor-law precedents. Return JSON only: {\"cases\":[{\"caseNumber\":\"\",\"summary\":\"\"}]}. Keep each summary in Korean, 1-2 short sentences.",
      },
      {
        role: "user",
        content: JSON.stringify({ keyword, precedents: top }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = safeJsonParse<{ cases: { caseNumber: string; summary: string }[] }>(stripCodeFence(raw));
  if (!parsed?.cases?.length) {
    return top.map((item) => ({ caseNumber: item.caseNumber, summary: item.content.slice(0, 180) }));
  }

  return parsed.cases.slice(0, 3).map((item) => ({ caseNumber: item.caseNumber, summary: item.summary }));
}

async function diagnoseContract(file: File) {
  const text = await extractPdfText(file);
  if (!text) {
    throw new Error("Could not extract text from PDF.");
  }

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You review Korean employment contracts. Return JSON only: {\"missing\":[\"keyword\"],\"note\":\"\"}. missing must be 3-12 concise keywords for likely missing mandatory clauses.",
      },
      {
        role: "user",
        content: `Review this contract text and list likely missing items.\n\n${text.slice(0, 16000)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = safeJsonParse<{ missing: string[]; note?: string }>(stripCodeFence(raw));
  if (!parsed) {
    throw new Error("Could not parse diagnosis output.");
  }

  return {
    missing: Array.isArray(parsed.missing) ? parsed.missing.slice(0, 12) : [],
    note: parsed.note ?? "",
  };
}

async function structureFact(input: string): Promise<FactShape> {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You structure incident facts. Return JSON only with keys: who, when, where, what_action, how, context. If unknown, use 'unknown'.",
      },
      { role: "user", content: input },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = safeJsonParse<Partial<FactShape>>(stripCodeFence(raw));
  if (!parsed) {
    throw new Error("Could not parse structured output.");
  }

  return {
    who: parsed.who ?? "unknown",
    when: parsed.when ?? "unknown",
    where: parsed.where ?? "unknown",
    what_action: parsed.what_action ?? "unknown",
    how: parsed.how ?? "unknown",
    context: parsed.context ?? "unknown",
  };
}

async function generateQuiz(industry: string) {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You generate labor-law quiz cards. Return JSON only: {\"cards\":[{\"question\":\"\",\"choices\":[\"\",\"\",\"\",\"\"],\"answerIndex\":0,\"explanation\":\"\"}]}. Create exactly 3 cards.",
      },
      { role: "user", content: `${industry} industry labor-law quiz cards, practical style.` },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = safeJsonParse<{
    cards: { question: string; choices: string[]; answerIndex: number; explanation: string }[];
  }>(stripCodeFence(raw));

  if (!parsed?.cards?.length) {
    throw new Error("Could not generate quiz cards.");
  }

  return parsed.cards.slice(0, 3).map((card) => ({
    question: card.question,
    choices: Array.isArray(card.choices) ? card.choices.slice(0, 4) : [],
    answerIndex: Number.isInteger(card.answerIndex) ? Math.min(Math.max(card.answerIndex, 0), 3) : 0,
    explanation: card.explanation,
  }));
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const tool = String(form.get("tool") || "") as ToolName;

      if (tool !== "contract-diagnosis") {
        return NextResponse.json({ error: "Unsupported tool." }, { status: 400 });
      }

      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
      }

      const result = await diagnoseContract(file);
      return NextResponse.json(result);
    }

    const body = (await req.json()) as {
      tool?: ToolName;
      keyword?: string;
      input?: string;
      industry?: string;
    };

    if (body.tool === "precedent-search") {
      const keyword = (body.keyword || "").trim();
      if (!keyword) {
        return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
      }
      const cases = await summarizePrecedents(keyword);
      return NextResponse.json({ cases });
    }

    if (body.tool === "fact-structure") {
      const input = (body.input || "").trim();
      if (!input) {
        return NextResponse.json({ error: "Input is required." }, { status: 400 });
      }
      const structured = await structureFact(input);
      return NextResponse.json({ structured });
    }

    if (body.tool === "quiz-generator") {
      const industry = (body.industry || "").trim();
      if (!industry) {
        return NextResponse.json({ error: "Industry is required." }, { status: 400 });
      }
      const cards = await generateQuiz(industry);
      return NextResponse.json({ cards });
    }

    return NextResponse.json({ error: "Unsupported tool." }, { status: 400 });
  } catch (error) {
    console.error("hero-tools api error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
