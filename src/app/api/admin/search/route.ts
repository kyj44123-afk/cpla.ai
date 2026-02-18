import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { withSecurity } from "@/lib/api-security";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const SearchSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export async function POST(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 30, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  const supabase = getSupabaseAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: key });
  const embedRes = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: parsed.data.query,
  });

  const embedding = embedRes.data[0]?.embedding;
  if (!embedding || embedding.length !== 1536) {
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 });
  }

  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: parsed.data.limit,
  });

  if (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }

  const docIds = [...new Set((data ?? []).map((d: { document_id: string }) => d.document_id))];
  const { data: docs } = await supabase.from("documents").select("id,title,source,filename").in("id", docIds);

  const docMap = new Map((docs ?? []).map((d) => [d.id, d]));

  const results = (data ?? []).map((item: any) => ({
    ...item,
    document: docMap.get(item.document_id) || null,
  }));

  return NextResponse.json({ results, count: results.length });
}