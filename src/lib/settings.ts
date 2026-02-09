import * as fs from "fs";
import * as path from "path";

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

export function getApiKey(keyName: "openai_api_key" | "national_law_api_key"): string {
    // First check environment variable
    const envMap: Record<string, string> = {
        openai_api_key: "OPENAI_API_KEY",
        national_law_api_key: "NATIONAL_LAW_API_KEY",
        supabase_service_role_key: "SUPABASE_SERVICE_ROLE_KEY",
    };

    const envValue = process.env[envMap[keyName]];
    if (envValue) {
        return envValue;
    }

    // Then check local settings file
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = fs.readFileSync(SETTINGS_PATH, "utf-8");
            const settings = JSON.parse(data);
            const value = settings[keyName] || "";

            // If encrypted (contains :), decrypt it. Otherwise use as is (migration support)
            if (value.includes(":")) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const { SecretsManager } = require("./SecretsManager");
                return SecretsManager.decrypt(value);
            }
            return value;
        }
    } catch (e) {
        console.error("Failed to read settings:", e);
    }

    return "";
}

export function getOpenAIKey(): string {
    return getApiKey("openai_api_key");
}

export function getNationalLawApiKey(): string {
    return getApiKey("national_law_api_key");
}

export function getSupabaseUrl(): string {
    // Check both possible environment variable names
    const env = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (env) return env;

    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            const data = fs.readFileSync(SETTINGS_PATH, "utf-8");
            const settings = JSON.parse(data);
            return settings.supabase_url || "";
        }
    } catch (e) { }
    return "";
}

export function getSupabaseServiceRoleKey(): string {
    // Service Role Key is sensitive, reuse getApiKey logic (which handles encryption path if we enable it for this key)
    // We need to allow getApiKey to accept this new key name.
    // However, getApiKey is typed restricted. Let's cast or update the type.
    return getApiKey("supabase_service_role_key" as any);
}
