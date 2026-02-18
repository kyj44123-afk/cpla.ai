import { NextResponse } from "next/server";
import { z } from "zod";

import { withSecurity } from "@/lib/api-security";
import { getEmbedding } from "@/lib/rag";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(200000),
});

function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
    if (end >= text.length) break;
  }
  return chunks;
}

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 30, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const supabase = getSupabaseAdmin();

    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const docsWithChunks = await Promise.all(
      (documents || []).map(async (doc) => {
        const { count } = await supabase
          .from("document_chunks")
          .select("*", { count: "exact", head: true })
          .eq("document_id", doc.id);
        return { ...doc, chunk_count: count || 0 };
      })
    );

    return NextResponse.json({ documents: docsWithChunks });
  } catch {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 10, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const parsed = DocumentSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { title, content } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ title, content })
      .select()
      .single();

    if (docError || !doc) throw new Error("create_failed");

    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i += 1) {
      const embedding = await getEmbedding(chunks[i]);
      await supabase.from("document_chunks").insert({
        document_id: doc.id,
        chunk_index: i,
        content: chunks[i],
        embedding,
      });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch {
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 20, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}