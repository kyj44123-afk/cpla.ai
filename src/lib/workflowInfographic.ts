export function buildWorkflowSteps(serviceName: string): string[] {
  switch (serviceName) {
    case "임금체불 진정사건 대리":
      return [
        "초기 사실관계 및 증빙자료 검토",
        "체불 항목·금액 산정 및 전략 수립",
        "노동청 진정 절차 대리 진행",
        "결과 안내 및 후속 대응",
      ];
    case "대지급금 신청 대리":
      return [
        "수급 가능성 사전 진단",
        "필수 서류 목록 확정 및 정리",
        "대지급금 신청 절차 대리 진행",
        "보완 대응 및 결과 안내",
      ];
    case "전문 공인노무사 상담":
      return [
        "초기 상담 접수 및 이슈 진단",
        "쟁점·리스크 구조화",
        "실행 가능한 대응 시나리오 제시",
        "후속 진행 계획 확정",
      ];
    default:
      return [
        `${serviceName} 관련 사실관계 진단`,
        "핵심 증빙자료 정리",
        "대응 절차 수립 및 실행",
        "결과 안내 및 후속 조치",
      ];
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fitText(text: string, limit = 28) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

export function buildWorkflowInfographicSvg(serviceName: string, workflowSteps: string[]) {
  const steps = workflowSteps.slice(0, 5);
  const width = 900;
  const top = 96;
  const gap = 22;
  const boxHeight = 66;
  const boxWidth = 740;
  const totalHeight = top + steps.length * (boxHeight + gap) + 50;
  const startX = (width - boxWidth) / 2;

  const blocks = steps
    .map((step, index) => {
      const y = top + index * (boxHeight + gap);
      const stepText = `${index + 1}. ${fitText(step, 48)}`;
      const nextY = y + boxHeight;
      const arrow = index < steps.length - 1
        ? `
    <line x1="${width / 2}" y1="${nextY + 2}" x2="${width / 2}" y2="${nextY + gap - 6}" stroke="#94a3b8" stroke-width="2" />
    <polygon points="${width / 2 - 6},${nextY + gap - 9} ${width / 2 + 6},${nextY + gap - 9} ${width / 2},${nextY + gap}" fill="#94a3b8" />`
        : "";
      return `
    <rect x="${startX}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="12" fill="#ffffff" stroke="#cbd5e1" />
    <text x="${startX + 24}" y="${y + 40}" font-size="22" fill="#0f172a" font-family="Pretendard, Apple SD Gothic Neo, Segoe UI, sans-serif">${escapeXml(stepText)}</text>${arrow}`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="${width / 2}" y="46" text-anchor="middle" font-size="30" font-weight="700" fill="#0f172a" font-family="Pretendard, Apple SD Gothic Neo, Segoe UI, sans-serif">${escapeXml(
    fitText(`${serviceName} 업무 플로우`, 30)
  )}</text>
  <text x="${width / 2}" y="72" text-anchor="middle" font-size="16" fill="#475569" font-family="Pretendard, Apple SD Gothic Neo, Segoe UI, sans-serif">신청 후 진행 순서 안내</text>
  ${blocks}
</svg>`;
}

export function buildWorkflowInfographicDataUrl(serviceName: string, workflowSteps: string[]) {
  const svg = buildWorkflowInfographicSvg(serviceName, workflowSteps);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
