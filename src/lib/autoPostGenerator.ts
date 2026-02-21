import { getOpenAI } from "@/lib/openai";
import { describeAutoPostPromptProfile } from "@/lib/autoPostPromptProfile";
import { getAutoPostPromptProfile } from "@/lib/settings";

function fallbackMarkdown(title: string) {
  return [
    `# ${title}`,
    "",
    "## 핵심 요약",
    "- 제목 기준으로 핵심 인사노무 쟁점을 정리합니다.",
    "- 현재 법적 리스크와 우선 대응 순서를 제시합니다.",
    "- 바로 실행 가능한 체크리스트를 제공합니다.",
    "",
    "## 실무 가이드",
    "1. 현재 상황을 사실관계 기준으로 정리합니다.",
    "2. 리스크 크기와 시급성을 구분합니다.",
    "3. 내부 대응과 외부 자문 필요 지점을 분리합니다.",
    "",
    "## 체크리스트",
    "- [ ] 관련 문서/기록 확보",
    "- [ ] 담당자 및 의사결정 라인 확인",
    "- [ ] 시한 이슈 및 법정 절차 확인",
    "",
    "## 다음 단계",
    "정확한 진단이 필요하면 상담예약 또는 RISK 진단으로 현재 상황을 점검하세요.",
  ].join("\n");
}

export async function generateAutoPostMarkdown(title: string): Promise<string> {
  const normalizedTitle = String(title || "").trim();
  if (!normalizedTitle) {
    return fallbackMarkdown("포스트");
  }

  try {
    const profile = getAutoPostPromptProfile();
    const profileLines = describeAutoPostPromptProfile(profile);
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.55,
      messages: [
        {
          role: "system",
          content: [
            "당신은 기업 인사노무 전문 콘텐츠 에디터다.",
            "반드시 한국어 마크다운으로 작성한다.",
            "과장, 단정, 근거 없는 확언을 금지한다.",
            "실행 가능한 단계와 체크리스트를 반드시 포함한다.",
            "출력은 마크다운 본문만 제공한다.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `포스트 제목: ${normalizedTitle}`,
            `프롬프트 프로필: ${profileLines.join(" / ")}`,
            "문서 구조:",
            "1) 제목",
            "2) 핵심 요약(3개 bullet)",
            "3) 배경 및 리스크 진단",
            "4) 단계별 실무 대응(3~5단계)",
            "5) 체크리스트(5개 내외)",
            "6) 마무리 및 CTA",
            "길이: 1200~2000자",
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    return content || fallbackMarkdown(normalizedTitle);
  } catch {
    return fallbackMarkdown(normalizedTitle);
  }
}

export async function generateDailyAutoPostTitles(count = 3): Promise<string[]> {
  const safeCount = Math.min(Math.max(count, 1), 5);
  const profile = getAutoPostPromptProfile();
  const profileLines = describeAutoPostPromptProfile(profile);

  try {
    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "당신은 기업 인사노무 전문 에디터다.",
            "매일 자동발행할 포스트 제목만 생성한다.",
            "출력은 JSON으로만 제공한다.",
          ].join("\n"),
        },
        {
          role: "user",
          content: [
            `생성 개수: ${safeCount}`,
            `프롬프트 프로필: ${profileLines.join(" / ")}`,
            `오늘 날짜(KST): ${new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}`,
            '출력 스키마: { "titles": ["", ""] }',
            "조건:",
            "- 실무형 인사노무/노동법률 주제",
            "- 과장 금지, 구체적 이슈 중심",
            "- 한국어 제목",
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { titles?: string[] };
    const titles = Array.isArray(parsed.titles)
      ? parsed.titles.map((v) => String(v || "").trim()).filter(Boolean).slice(0, safeCount)
      : [];

    if (titles.length > 0) return titles;
  } catch {
    // fallback below
  }

  const kstDate = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
  return [
    `${kstDate} 기준 근로계약 리스크 점검 포인트`,
    `${kstDate} 기준 직장 내 괴롭힘 대응 실무 가이드`,
    `${kstDate} 기준 임금·퇴직금 분쟁 예방 체크리스트`,
  ].slice(0, safeCount);
}

export function shouldRefreshAutoPost(updatedAt: string | null | undefined, maxAgeHours = 24) {
  if (!updatedAt) return true;
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return true;
  const ageMs = Date.now() - updated;
  return ageMs > maxAgeHours * 60 * 60 * 1000;
}
