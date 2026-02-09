import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import OpenAI from "openai";

export const runtime = "nodejs";

function chunkText(text: string, chunkSize = 1200, overlap = 150) {
  const clean = text.replace(/\u0000/g, "").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(clean.length, i + chunkSize);
    const chunk = clean.slice(i, end).trim();
    if (chunk) chunks.push(chunk);
    i = end - overlap;
    if (i < 0) i = 0;
    if (end === clean.length) break;
  }
  return chunks;
}

async function extractTextFromFile(file: File) {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return buf.toString("utf-8");
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const mod = (await import("pdf-parse")) as unknown as {
      default?: (data: Buffer) => Promise<{ text: string }>;
      (data: Buffer): Promise<{ text: string }>;
    };
    const pdfParse =
      typeof (mod as any).default === "function"
        ? (mod as any).default
        : (mod as any);
    const out = await pdfParse(buf);
    return out.text ?? "";
  }

  throw new Error("Unsupported file type. Please upload a PDF or TXT.");
}

async function embedIfPossible(texts: string[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const client = new OpenAI({ apiKey: key });
  const res = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();

  const form = await req.formData();
  const file = form.get("file");
  const title = (form.get("title")?.toString() ?? "").trim();
  const source = (form.get("source")?.toString() ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const text = await extractTextFromFile(file);
  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No text extracted" }, { status: 400 });
  }

  const embeddings = await embedIfPossible(chunks);

  // documents: 원문 메타(검색/관리용)
  const { data: doc, error: docErr } = await supabase
    .from("documents")
    .insert({
      title: title || file.name,
      source: source || null,
      filename: file.name,
      mime_type: file.type || null,
      content: text,
    })
    .select("id")
    .single();

  if (docErr || !doc?.id) {
    return NextResponse.json(
      { error: "Failed to save document", details: docErr?.message },
      { status: 500 }
    );
  }

  // document_chunks: 벡터 검색 대상(청크 단위)
  const rows = chunks.map((c, idx) => ({
    document_id: doc.id,
    chunk_index: idx,
    content: c,
    embedding: embeddings ? embeddings[idx] : null,
  }));

  const { error: chunkErr } = await supabase.from("document_chunks").insert(rows);
  if (chunkErr) {
    return NextResponse.json(
      { error: "Failed to save chunks", details: chunkErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    documentId: doc.id,
    chunks: chunks.length,
    embedded: Boolean(embeddings),
  });
}

