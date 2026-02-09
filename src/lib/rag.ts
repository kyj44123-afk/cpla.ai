import { openai } from "./openai";
import { getSupabaseAdmin } from "./supabaseAdmin";

export interface DocumentChunk {
    id: number;
    document_id: number;
    content: string;
    similarity: number;
}

export async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: text.replace(/\n/g, " "),
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw new Error("Failed to generate embedding");
    }
}

export async function retrieveContext(query: string): Promise<DocumentChunk[]> {
    try {
        const supabase = getSupabaseAdmin();
        const embedding = await getEmbedding(query);

        const { data: chunks, error } = await supabase.rpc("match_document_chunks", {
            query_embedding: embedding,
            match_count: 5,
        });

        if (error) {
            console.error("Supabase RPC error:", error);
            return [];
        }

        return chunks as DocumentChunk[];
    } catch (error) {
        console.error("Context retrieval failed:", error);
        return [];
    }
}
