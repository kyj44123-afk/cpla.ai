import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";

import { withSecurity } from "@/lib/api-security";
import { BASE_LABOR_SERVICES } from "@/lib/laborServicesCatalog";
import { buildWorkflowInfographicDataUrl, buildWorkflowSteps } from "@/lib/workflowInfographic";

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

type Audience = "worker" | "employer";

type ManagedService = {
  name: string;
  description: string;
  audience?: Audience;
  keywords?: string[];
  workflowSteps?: string[];
  workflowInfographic?: string;
};

type SettingsShape = {
  labor_services?: ManagedService[];
  labor_services_worker?: ManagedService[];
  labor_services_employer?: ManagedService[];
  [key: string]: unknown;
};

const ServiceInputSchema = z.object({
  workerServices: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(2000),
        keywords: z.array(z.string().trim().max(80)).max(30).optional(),
        workflowSteps: z.array(z.string().trim().max(300)).max(10).optional(),
      })
    )
    .optional(),
  employerServices: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(2000),
        keywords: z.array(z.string().trim().max(80)).max(30).optional(),
        workflowSteps: z.array(z.string().trim().max(300)).max(10).optional(),
      })
    )
    .optional(),
});

const LEGACY_SERVICE_NAME_MAP: Record<string, string> = {
  "직장 내 괴롭힘 신고 대응": "직장 내 괴롭힘 신고 지원",
  "직장 내 성희롱 대응": "직장 내 성희롱 신고 지원",
};

function canonicalizeServiceName(name: string) {
  const trimmed = String(name || "").trim();
  return LEGACY_SERVICE_NAME_MAP[trimmed] || trimmed;
}

const DEFAULT_SERVICES: ManagedService[] = BASE_LABOR_SERVICES.map((service) => {
  const steps = buildWorkflowSteps(service.name);
  return {
    ...service,
    workflowSteps: steps,
    workflowInfographic: buildWorkflowInfographicDataUrl(service.name, steps),
  };
});

function readSettings(): SettingsShape {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as SettingsShape;
  } catch {
    return {};
  }
}

function writeSettings(next: SettingsShape) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2));
}

function normalizeServices(services: unknown, audience: Audience): ManagedService[] {
  if (!Array.isArray(services)) return [];
  return services
    .map((s) => ({
      name: canonicalizeServiceName(String((s as ManagedService)?.name || "")),
      description: String((s as ManagedService)?.description || "").trim(),
      audience,
      keywords: Array.isArray((s as ManagedService)?.keywords)
        ? (s as ManagedService).keywords!.map((k) => String(k || "").trim()).filter(Boolean)
        : [],
      workflowSteps: Array.isArray((s as ManagedService)?.workflowSteps)
        ? (s as ManagedService).workflowSteps!.map((w) => String(w || "").trim()).filter(Boolean)
        : undefined,
      workflowInfographic:
        typeof (s as ManagedService)?.workflowInfographic === "string"
          ? String((s as ManagedService).workflowInfographic)
          : undefined,
    }))
    .filter((s) => s.name && s.description);
}

function mergeWithDefaults(custom: ManagedService[]) {
  const map = new Map<string, ManagedService>();
  for (const svc of DEFAULT_SERVICES) map.set(`${svc.audience}:${svc.name}`, svc);
  for (const svc of custom) map.set(`${svc.audience}:${svc.name}`, svc);
  return Array.from(map.values());
}

export async function GET(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 30, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const settings = readSettings();

    const legacy = normalizeServices(settings.labor_services, "worker");
    const workerCustom = normalizeServices(settings.labor_services_worker, "worker");
    const employerCustom = normalizeServices(settings.labor_services_employer, "employer");

    const merged = mergeWithDefaults([...legacy, ...workerCustom, ...employerCustom]);

    return NextResponse.json({
      workerServices: merged.filter((s) => s.audience === "worker"),
      employerServices: merged.filter((s) => s.audience === "employer"),
      defaultKeys: DEFAULT_SERVICES.map((s) => `${s.audience}:${s.name}`),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const securityError = await withSecurity(req, {
    checkAuth: true,
    rateLimit: { limit: 10, windowMs: 60_000 },
  });
  if (securityError) return securityError;

  try {
    const parsed = ServiceInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const workerNormalized = normalizeServices(parsed.data.workerServices, "worker").map((service) => {
      const steps = service.workflowSteps && service.workflowSteps.length > 0
        ? service.workflowSteps.slice(0, 6)
        : buildWorkflowSteps(service.name);
      return {
        ...service,
        workflowSteps: steps,
        workflowInfographic: buildWorkflowInfographicDataUrl(service.name, steps),
      };
    });

    const employerNormalized = normalizeServices(parsed.data.employerServices, "employer").map((service) => {
      const steps = service.workflowSteps && service.workflowSteps.length > 0
        ? service.workflowSteps.slice(0, 6)
        : buildWorkflowSteps(service.name);
      return {
        ...service,
        workflowSteps: steps,
        workflowInfographic: buildWorkflowInfographicDataUrl(service.name, steps),
      };
    });

    const settings = readSettings();
    settings.labor_services_worker = workerNormalized;
    settings.labor_services_employer = employerNormalized;
    if ("labor_services" in settings) delete settings.labor_services;
    writeSettings(settings);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save services" }, { status: 500 });
  }
}