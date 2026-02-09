import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This API should be called by a cron job (e.g., Vercel Cron) once daily
// to delete personal data older than 10 days

export async function GET(request: Request) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
            { error: "Supabase not configured" },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const cutoffDate = tenDaysAgo.toISOString();

        // Delete old requests (personal info)
        const { error: requestsError } = await supabase
            .from("requests")
            .delete()
            .lt("created_at", cutoffDate);

        // Delete old chat sessions (cascades to messages)
        const { error: sessionsError } = await supabase
            .from("chat_sessions")
            .delete()
            .lt("created_at", cutoffDate);

        // Delete old analytics events
        const { error: analyticsError } = await supabase
            .from("analytics_events")
            .delete()
            .lt("created_at", cutoffDate);

        if (requestsError || sessionsError || analyticsError) {
            console.error("Cleanup errors:", { requestsError, sessionsError, analyticsError });
            return NextResponse.json(
                { error: "Partial cleanup failure", details: { requestsError, sessionsError, analyticsError } },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Cleanup completed successfully",
            cutoffDate,
        });
    } catch (error: any) {
        console.error("Cleanup error:", error);
        return NextResponse.json(
            { error: error.message || "Cleanup failed" },
            { status: 500 }
        );
    }
}
