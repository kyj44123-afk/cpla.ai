import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
    try {
        const { contact, name, query, sessionId } = await req.json();

        if (!contact) {
            return NextResponse.json({ error: "Contact info required" }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        let targetSessionId = sessionId;

        // 1. Create a Chat Session ONLY if sessionId is not provided
        if (!targetSessionId) {
            const { data: session, error: sessionError } = await supabase
                .from("chat_sessions")
                .insert({})
                .select()
                .single();

            if (sessionError || !session) {
                console.error("Session creation error:", sessionError);
                throw new Error("Failed to create session");
            }
            targetSessionId = session.id;
        }

        // 2. Store Request/Contact Info linked to Session
        const { error: requestError } = await supabase.from("requests").insert({
            type: "contact_submission",
            data: { contact, name, initial_query: query },
            session_id: targetSessionId,
        });

        if (requestError) {
            console.error("Request insertion error:", requestError);
            throw new Error("Failed to store contact info");
        }

        return NextResponse.json({ sessionId: targetSessionId, success: true });

    } catch (error) {
        console.error("Contact API Detailed Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
