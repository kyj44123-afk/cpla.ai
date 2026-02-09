import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from("requests")
            .select("*")
            .eq("type", "contact_submission")
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        // Transform data for UI
        const inquiries = data.map((item: any) => ({
            id: item.id,
            created_at: item.created_at,
            name: item.data?.name || undefined,
            contact: item.data?.contact || "N/A",
            query: item.data?.initial_query || "내용 없음",
            session_id: item.session_id,
            status: item.data?.status || "new", // Placeholder for future status
        }));

        return NextResponse.json(inquiries);
    } catch (error) {
        console.error("Inquiries fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
    }
}
