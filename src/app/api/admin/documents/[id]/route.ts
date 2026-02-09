import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  const { id } = await params;

  // document_chunks는 CASCADE로 자동 삭제됨
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete document", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
