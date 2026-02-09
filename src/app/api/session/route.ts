import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
    try {
        const supabase = getSupabaseAdmin();

        const { data: session, error } = await supabase
            .from("chat_sessions")
            .insert({})
            .select("id")
            .single();

        if (error || !session) {
            throw new Error("Failed to create session");
        }

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error("Session API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
