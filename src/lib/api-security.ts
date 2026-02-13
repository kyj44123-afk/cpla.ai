
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";

// --- Rate Limiting (Simple In-Memory for Demo/MVP) ---
// In a real production serverless environment (like Vercel), 
// you should use KV (Radius/Upstash) because in-memory state is not shared between lambdas.
// However, for this task, I will implement a simple Map-based limiter as a starting point.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function checkRateLimit(ip: string, limit = 10, windowMs = 60 * 1000): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - record.lastReset > windowMs) {
        record.count = 0;
        record.lastReset = now;
    }

    if (record.count >= limit) {
        return false;
    }

    record.count += 1;
    rateLimitMap.set(ip, record);
    return true;
}

// --- Auth Verification ---
export async function verifyAdminSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    // Also check for Supabase session if migrated to full Supabase Auth later.
    // For now, we respect the existing "admin_session" cookie logic from middleware.
    if (session?.value === "authenticated") {
        return true;
    }
    return false;
}

// --- Validation Wrapper ---
export async function validateBody<T>(req: NextRequest, schema: z.Schema<T>): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
    try {
        const body = await req.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return {
                success: false,
                error: NextResponse.json(
                    { error: "Invalid input", details: parsed.error.issues },
                    { status: 400 }
                ),
            };
        }

        return { success: true, data: parsed.data };
    } catch (e) {
        return {
            success: false,
            error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
        };
    }
}

// --- Common Security Wrapper ---
type SecurityOptions = {
    checkAuth?: boolean;
    rateLimit?: { limit: number; windowMs?: number };
};

export async function withSecurity(
    req: NextRequest,
    options: SecurityOptions = { checkAuth: true, rateLimit: { limit: 20 } }
): Promise<NextResponse | null> {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 1. Rate Limit
    if (options.rateLimit) {
        const passed = checkRateLimit(ip, options.rateLimit.limit, options.rateLimit.windowMs);
        if (!passed) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }
    }

    // 2. Auth Check
    if (options.checkAuth) {
        const isAdmin = await verifyAdminSession();
        if (!isAdmin) {
            // Allow if authorized via Authorization header (e.g. Service Role) - Optional extension
            // For now, strict cookie check
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    return null;
}
