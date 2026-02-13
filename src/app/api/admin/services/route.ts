import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { buildWorkflowInfographicDataUrl, buildWorkflowSteps } from "@/lib/workflowInfographic";

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");

type ManagedService = {
  name: string;
  description: string;
  keywords?: string[];
  workflowSteps?: string[];
  workflowInfographic?: string;
};

type SettingsShape = {
  labor_services?: ManagedService[];
  [key: string]: unknown;
};

const DEFAULT_SERVICES: ManagedService[] = [
  {
    name: "전문 공인노무사 상담",
    description: "핵심 이슈의 사실관계와 절차 선택을 빠르게 정리해 초기 대응 전략을 설계합니다.",
    keywords: ["상담", "전략", "진단", "노무사"],
    workflowSteps: buildWorkflowSteps("전문 공인노무사 상담"),
    workflowInfographic: buildWorkflowInfographicDataUrl("전문 공인노무사 상담", buildWorkflowSteps("전문 공인노무사 상담")),
  },
  {
    name: "임금체불 진정사건 대리",
    description: "미지급 임금·수당·퇴직금 증빙을 정리하고 노동청 진정 절차를 대리합니다.",
    keywords: ["임금", "체불", "미지급", "퇴직금", "노동청", "진정"],
    workflowSteps: buildWorkflowSteps("임금체불 진정사건 대리"),
    workflowInfographic: buildWorkflowInfographicDataUrl("임금체불 진정사건 대리", buildWorkflowSteps("임금체불 진정사건 대리")),
  },
  {
    name: "대지급금 신청 대리",
    description: "도산·폐업 또는 지급불능 정황을 검토해 대지급금 신청 요건 검토와 신청 절차를 대리합니다.",
    keywords: ["대지급금", "체당금", "폐업", "도산", "파산", "지급불능"],
    workflowSteps: buildWorkflowSteps("대지급금 신청 대리"),
    workflowInfographic: buildWorkflowInfographicDataUrl("대지급금 신청 대리", buildWorkflowSteps("대지급금 신청 대리")),
  },
];

function readSettings(): SettingsShape {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return {};
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as SettingsShape;
  } catch (error) {
    console.error("Failed to read settings:", error);
    return {};
  }
}

function writeSettings(next: SettingsShape) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(next, null, 2));
}

function normalizeServices(services: unknown): ManagedService[] {
  if (!Array.isArray(services)) return [];
  return services
    .map((s) => ({
      name: String((s as ManagedService)?.name || "").trim(),
      description: String((s as ManagedService)?.description || "").trim(),
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
  for (const svc of DEFAULT_SERVICES) map.set(svc.name, svc);
  for (const svc of custom) map.set(svc.name, svc);
  return Array.from(map.values());
}

export async function GET() {
  try {
    const settings = readSettings();
    const custom = normalizeServices(settings.labor_services);
    const merged = mergeWithDefaults(custom);
    return NextResponse.json({ services: merged, defaults: DEFAULT_SERVICES.map((s) => s.name) });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { services?: ManagedService[] };
    const normalized = normalizeServices(body.services).map((service) => {
      const steps = buildWorkflowSteps(service.name);
      const image = buildWorkflowInfographicDataUrl(service.name, steps);
      return {
        ...service,
        workflowSteps: steps,
        workflowInfographic: image,
      };
    });
    const settings = readSettings();
    settings.labor_services = normalized;
    writeSettings(settings);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save services:", error);
    return NextResponse.json({ error: "Failed to save services" }, { status: 500 });
  }
}
