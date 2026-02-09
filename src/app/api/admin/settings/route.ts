import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

function readSettings(): Record<string, string> {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = fs.readFileSync(SETTINGS_PATH, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Failed to read settings:", e);
    }
    return {};
}

function writeSettings(settings: Record<string, string>): void {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export async function GET() {
    try {
        const settings = readSettings();

        // Mask keys for display
        const masked: Record<string, string> = {};
        for (const [key, value] of Object.entries(settings)) {
            if (value && value.length > 8) {
                masked[key] = "•".repeat(value.length - 4) + value.slice(-4);
            } else if (value) {
                masked[key] = "••••••••";
            } else {
                masked[key] = "";
            }
        }

        return NextResponse.json({
            openai_api_key: masked.openai_api_key || "",
            national_law_api_key: masked.national_law_api_key || "",
            supabase_url: settings.supabase_url || "",
            supabase_service_role_key: masked.supabase_service_role_key || "",
        });
    } catch (error) {
        console.error("Settings fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const current = readSettings();

        // Create/Load key before saving (this ensures .secret.key exists)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SecretsManager } = require("@/lib/SecretsManager");

        // Only update if not masked (starts with •)
        if (body.openai_api_key && !body.openai_api_key.startsWith("•")) {
            current.openai_api_key = SecretsManager.encrypt(body.openai_api_key);
        }
        if (body.national_law_api_key && !body.national_law_api_key.startsWith("•")) {
            current.national_law_api_key = SecretsManager.encrypt(body.national_law_api_key);
        }
        if (body.supabase_url) {
            current.supabase_url = body.supabase_url;
        }
        if (body.supabase_service_role_key && !body.supabase_service_role_key.startsWith("•")) {
            current.supabase_service_role_key = SecretsManager.encrypt(body.supabase_service_role_key);
        }

        writeSettings(current);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Settings save error:", error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
