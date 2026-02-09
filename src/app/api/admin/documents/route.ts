import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getEmbedding } from "@/lib/rag";

// Helper to chunk text
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

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: documents, error } = await supabase
      .from("documents")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Get chunk counts for each document
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
  } catch (error) {
    console.error("Documents fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1. Create document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({ title, content })
      .select()
      .single();

    if (docError || !doc) throw new Error("Failed to create document");

    // 2. Chunk the content
    const chunks = chunkText(content);

    // 3. Create embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await getEmbedding(chunks[i]);

      await supabase.from("document_chunks").insert({
        document_id: doc.id,
        chunk_index: i,
        content: chunks[i],
        embedding,
      });
    }

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Chunks will be deleted automatically due to CASCADE
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
