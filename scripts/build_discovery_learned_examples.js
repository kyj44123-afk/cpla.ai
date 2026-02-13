/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const SETTINGS_PATH = path.join(process.cwd(), ".settings.json");
const SECRET_KEY_PATH = path.join(process.cwd(), ".secret.key");
const OUTPUT_PATH = path.join(process.cwd(), "src", "lib", "discoveryLearnedExamples.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function getSecretKey() {
  if (!fs.existsSync(SECRET_KEY_PATH)) {
    throw new Error(`Missing secret key file: ${SECRET_KEY_PATH}`);
  }
  const hexKey = fs.readFileSync(SECRET_KEY_PATH, "utf-8").trim();
  return Buffer.from(hexKey, "hex");
}

function decryptIfNeeded(value) {
  if (!value || typeof value !== "string") return "";
  const parts = value.split(":");
  if (parts.length !== 2) return value;
  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = parts[1];
  const key = getSecretKey();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function inferCategoryFromService(serviceName) {
  const s = normalizeText(serviceName);
  if (!s) return "other";

  if (
    /(임금체불|대지급금|퇴직금|수당|최저임금|임금명세서|통상임금|포괄임금|체불|미지급)/.test(s)
  ) {
    return "wage_arrears";
  }
  if (/(해고|징계|권고사직|사직강요|전직|전보|면직|구제신청)/.test(s)) {
    return "dismissal";
  }
  if (/(괴롭힘|성희롱|고충처리)/.test(s)) {
    return "harassment";
  }
  if (/(산재|요양|장해급여|유족급여|장의비|업무상질병)/.test(s)) {
    return "industrial_accident";
  }
  if (
    /(근로계약|취업규칙|인사규정|임금체계|성과급|인센티브|인사평가|근로감독|컴플라이언스|4대보험|파견|도급|노사협의회|단체교섭|단체협약|노무진단|due diligence|dd)/i.test(
      s
    )
  ) {
    return "contract";
  }
  return "other";
}

function pushUnique(list, value) {
  if (!value) return;
  if (!list.includes(value)) list.push(value);
}

async function fetchLogs(supabase, totalLimit = 3000) {
  const perPage = 500;
  const rows = [];
  for (let from = 0; from < totalLimit; from += perPage) {
    const to = from + perPage - 1;
    const { data, error } = await supabase
      .from("discovery_step_logs")
      .select("session_id, step, event_type, audience, payload, created_at")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < perPage) break;
  }
  return rows;
}

function buildLearnedExamples(logs) {
  const bySession = new Map();
  for (const row of logs) {
    const sessionId = row.session_id;
    if (!bySession.has(sessionId)) bySession.set(sessionId, []);
    bySession.get(sessionId).push(row);
  }

  const aggregate = new Map();

  for (const events of bySession.values()) {
    events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let situation = "";
    let audience = "";
    let selectedService = "";
    let clickedService = "";
    const quickServices = [];
    let lastSeen = "";

    for (const e of events) {
      const payload = e.payload || {};
      if (!audience && e.audience) audience = e.audience;
      if (e.created_at && (!lastSeen || e.created_at > lastSeen)) lastSeen = e.created_at;

      if (e.event_type === "step1_submitted") {
        situation = normalizeText(payload.input);
      }
      if (e.event_type === "step2_question_generated" || e.event_type === "step3_question_generated") {
        if (Array.isArray(payload.quick_services)) {
          for (const name of payload.quick_services) {
            pushUnique(quickServices, normalizeText(name));
          }
        }
      }
      if (e.event_type === "quick_service_clicked") {
        clickedService = normalizeText(payload.service);
      }
      if (e.event_type === "contact_submitted") {
        selectedService = normalizeText(payload.selected_service);
      }
    }

    const baseText = normalizeText(situation);
    const targetService = selectedService || clickedService;
    if (!baseText || baseText.length < 6 || !targetService) continue;
    const selectedInQuick = !!selectedService && quickServices.includes(selectedService);
    const clickedInQuick = !!clickedService && quickServices.includes(clickedService);
    const acceptedRecommendation = selectedInQuick || clickedInQuick || (selectedService && clickedService && selectedService === clickedService);
    if (!acceptedRecommendation) continue;

    const services = [];
    pushUnique(services, targetService);
    for (const name of quickServices) {
      if (services.length >= 2) break;
      pushUnique(services, name);
    }

    const category = inferCategoryFromService(targetService);
    const safeAudience = audience === "employer" ? "employer" : "worker";
    const key = `${safeAudience}|${category}|${baseText}|${targetService}`;

    if (!aggregate.has(key)) {
      aggregate.set(key, {
        text: baseText,
        audience: safeAudience,
        category,
        services,
        count: 1,
        lastSeen,
      });
    } else {
      const item = aggregate.get(key);
      item.count += 1;
      if (lastSeen > item.lastSeen) item.lastSeen = lastSeen;
      for (const name of services) pushUnique(item.services, name);
    }
  }

  return Array.from(aggregate.values())
    .sort((a, b) => b.count - a.count || String(b.lastSeen).localeCompare(String(a.lastSeen)))
    .slice(0, 300);
}

async function main() {
  const settings = readJson(SETTINGS_PATH);
  if (!settings) throw new Error(`Missing settings file: ${SETTINGS_PATH}`);

  const url = settings.supabase_url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const encrypted = settings.supabase_service_role_key || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = decryptIfNeeded(encrypted);

  if (!url || !key) {
    throw new Error("Supabase URL or Service Role key missing.");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const logs = await fetchLogs(supabase, 3000);
  const learned = buildLearnedExamples(logs);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(learned, null, 2), "utf-8");
  console.log(`Fetched logs: ${logs.length}`);
  console.log(`Learned examples: ${learned.length}`);
  console.log(`Wrote: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
