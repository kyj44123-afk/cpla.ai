import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query, limit = 10 } = body as { query?: string; limit?: number };
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey: key });
  const embedRes = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const embedding = embedRes.data[0]?.embedding;
  if (!embedding || embedding.length !== 1536) {
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 });
  }

  // Supabase vector search
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: Math.min(limit, 50),
  });

  if (error) {
    return NextResponse.json(
      { error: "Search failed", details: error.message },
      { status: 500 }
    );
  }

  // 문서 정보도 함께 가져오기
  const docIds = [...new Set((data ?? []).map((d: { document_id: string }) => d.document_id))];
  const { data: docs } = await supabase
    .from("documents")
    .select("id,title,source,filename")
    .in("id", docIds);

  const docMap = new Map((docs ?? []).map((d) => [d.id, d]));

  const results = (data ?? []).map((item: any) => ({
    ...item,
    document: docMap.get(item.document_id) || null,
  }));

  return NextResponse.json({ results, count: results.length });
}
