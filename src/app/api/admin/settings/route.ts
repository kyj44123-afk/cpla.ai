import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/api-security";
import {
  AutoPostPromptProfileSchema,
  normalizeAutoPostPromptProfile,
} from "@/lib/autoPostPromptProfile";

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

type SettingsStore = {
  auto_post_prompt_profile?: unknown;
  auto_post_prompt_updated_at?: string;
  [key: string]: unknown;
};

function readSettings(): SettingsStore {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as SettingsStore;
  } catch {
    return {};
  }
}

function writeSettings(next: SettingsStore) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 30, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  const settings = readSettings();
  return NextResponse.json({
    autoPostPromptProfile: normalizeAutoPostPromptProfile(settings.auto_post_prompt_profile),
    updatedAt: settings.auto_post_prompt_updated_at ?? null,
  });
}

export async function POST(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 10, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const body = (await req.json()) as { autoPostPromptProfile?: unknown };
    const parsed = AutoPostPromptProfileSchema.safeParse(body.autoPostPromptProfile);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid auto post prompt profile" }, { status: 400 });
    }

    const settings = readSettings();
    settings.auto_post_prompt_profile = parsed.data;
    settings.auto_post_prompt_updated_at = new Date().toISOString();
    writeSettings(settings);

    return NextResponse.json({ success: true, updatedAt: settings.auto_post_prompt_updated_at });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
