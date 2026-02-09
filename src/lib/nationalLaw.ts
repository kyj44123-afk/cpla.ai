import { getNationalLawApiKey } from "./settings";

interface LawSearchResult {
    title: string;
    content: string;
    lawId?: string;
    promulgationDate?: string;
    caseNumber?: string;  // 사건번호
    judgeDate?: string;   // 선고일자
}

// ============================================
// CPLA 법령 화이트리스트 (공인노무사법 시행령 제2조)
// ============================================
const CPLA_LAW_WHITELIST = [
    // 노동 관계 법령 (별표 1)
    "근로기준법", "최저임금법", "산업안전보건법", "산업재해보상보험법",
    "고용보험법", "직업안정법", "고용정책기본법", "남녀고용평등법",
    "남녀고용평등과 일·가정 양립 지원에 관한 법률",
    "노동조합법", "노동조합및노동관계조정법", "노동관계조정법",
    "근로자참여및협력증진에관한법률", "근로자참여 및 협력증진에 관한 법률",
    "파견근로자보호등에관한법률", "파견근로자보호 등에 관한 법률",
    "기간제및단시간근로자보호등에관한법률", "기간제 및 단시간근로자 보호 등에 관한 법률",
    "근로복지기본법", "퇴직급여보장법", "근로자퇴직급여 보장법",
    "임금채권보장법", "직업능력개발법", "근로자직업능력개발법",
    "외국인근로자의고용등에관한법률", "외국인근로자의 고용 등에 관한 법률",
    "선원법", "건설근로자의고용개선등에관한법률",
    "채용절차의공정화에관한법률", "청년고용촉진특별법",
    "고령자고용촉진법", "고령자고용법", "장애인고용촉진법", "장애인고용법",
    "공무원노조법", "교원노조법", "공무원의 노동조합 설립 및 운영 등에 관한 법률",
    "교원의 노동조합 설립 및 운영 등에 관한 법률",
    // 사회보험 관계 법령 (별표 19의2)
    "국민연금법", "국민건강보험법", "의료보험법", "고용보험및산업재해보상보험의보험료징수등에관한법률",
    "노인장기요양보험법", "사립학교교직원연금법", "별정우체국법",
    // 공통 용어
    "근로", "노동", "임금", "해고", "퇴직", "산재", "취업규칙", "단체협약", "노조", "파업", "쟁의"
];

/**
 * 국가법령정보센터 API를 사용하여 법령 검색
 * API 문서: https://www.law.go.kr/DRF/lawSearch.do
 */
export async function searchNationalLaw(query: string): Promise<LawSearchResult[]> {
    const apiKey = getNationalLawApiKey();

    if (!apiKey) {
        console.log("National Law API key not configured, skipping law search");
        return [];
    }

    try {
        // 국가법령정보센터 API 호출
        // OC: Open API Client ID (사용자 ID)
        // target: law (법령), prec (판례), admrul (행정규칙)
        // type: XML 또는 HTML
        // query: 검색어
        const url = new URL("https://www.law.go.kr/DRF/lawSearch.do");
        url.searchParams.set("OC", apiKey);
        url.searchParams.set("target", "law");
        url.searchParams.set("type", "XML");
        url.searchParams.set("query", query);
        url.searchParams.set("display", "5"); // 최대 5개 결과

        console.log("Searching National Law API for:", query);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/xml",
            },
        });

        if (!response.ok) {
            console.error("National Law API error:", response.status);
            return [];
        }

        const xmlText = await response.text();

        // 간단한 XML 파싱 (브라우저 환경이 아니므로 정규식 사용)
        const results: LawSearchResult[] = [];

        // <법령명_한글> 태그에서 법령 이름 추출
        const lawNameMatches = xmlText.matchAll(/<법령명_한글>([^<]+)<\/법령명_한글>/g);
        const lawNames = Array.from(lawNameMatches).map(m => m[1]);

        // <조문내용> 태그에서 조문 내용 추출 (있는 경우)
        const contentMatches = xmlText.matchAll(/<조문내용>([^<]+)<\/조문내용>/g);
        const contents = Array.from(contentMatches).map(m => m[1]);

        // 결과 구성
        for (let i = 0; i < Math.min(lawNames.length, 5); i++) {
            results.push({
                title: lawNames[i] || "",
                content: contents[i] || `${lawNames[i]} 관련 법령`,
            });
        }

        console.log(`Found ${results.length} law results for query: ${query}`);
        return results;

    } catch (error) {
        console.error("National Law API error:", error);
        return [];
    }
}

/**
 * 판례 검색
 */
// Helper to extract content from XML tags, handling CDATA and attributes
function extractTag(xml: string, tagName: string): string[] {
    const results: string[] = [];
    // Match <tagName ...>(...)</tagName>
    // Capture group 1: CDATA content
    // Capture group 2: Normal content
    const regex = new RegExp(`<${tagName}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tagName}>`, "g");

    let match;
    while ((match = regex.exec(xml)) !== null) {
        results.push(match[1] || match[2] || "");
    }
    return results;
}

// Helper to fetch details for a specific case ID
async function getPrecedentDetail(id: string): Promise<{ content: string; referencedLaws: string[] }> {
    const apiKey = getNationalLawApiKey();
    if (!apiKey) return { content: "", referencedLaws: [] };

    try {
        const url = new URL("https://www.law.go.kr/DRF/lawService.do");
        url.searchParams.set("OC", apiKey);
        url.searchParams.set("target", "prec");
        url.searchParams.set("ID", id);
        url.searchParams.set("type", "XML");

        const response = await fetch(url.toString());
        if (!response.ok) return { content: "", referencedLaws: [] };

        const xmlText = await response.text();

        // Extract referenced laws (참조조문)
        const referencedLaws = extractTag(xmlText, "참조조문");
        const lawsText = referencedLaws.join(" ");

        // Helper to clean content (remove party info, HTML, excessive whitespace)
        const cleanContent = (text: string): string => {
            const cleaned = text
                .replace(/<[^>]*>?/gm, "") // Remove HTML tags
                .replace(/【[^】]*】/g, "") // Remove 【원고】【피고】 etc.
                .replace(/\[[^\]]*\]/g, (match) => {
                    // Keep numbered items like [1], [2], remove party info like [원고, 항소인]
                    if (/^\[\d+\]$/.test(match)) return match;
                    if (match.includes("원고") || match.includes("피고") || match.includes("항소") || match.includes("상고")) return "";
                    return match;
                })
                .replace(/원고\s*\(소송대리인[^)]*\)/g, "") // Remove 원고 (소송대리인...)
                .replace(/피고\s*\(소송대리인[^)]*\)/g, "") // Remove 피고 (소송대리인...)
                .replace(/\s+/g, " ") // Normalize whitespace
                .trim();
            return cleaned;
        };

        let content = "";

        // 1. Try 판결요지 (primary source - should be clean)
        const summaries = extractTag(xmlText, "판결요지");
        if (summaries.length > 0 && summaries[0].trim()) {
            content = cleanContent(summaries[0]);
        }

        // 2. Fallback to 판시사항 (what the court decided)
        if (!content || content.length < 50) {
            const holdings = extractTag(xmlText, "판시사항");
            if (holdings.length > 0 && holdings[0].trim()) {
                const holdingText = cleanContent(holdings[0]);
                if (holdingText.length > content.length) {
                    content = holdingText;
                }
            }
        }

        // 3. If still no meaningful content, extract 이유 and create a summary format
        if (!content || content.length < 50) {
            const reasons = extractTag(xmlText, "이유");
            if (reasons.length > 0 && reasons[0].trim()) {
                const reasonText = cleanContent(reasons[0]);

                // Extract the core reasoning (look for key phrases)
                const keyPhrases = [
                    /이\s*사건[^.。]*[.。]/g,
                    /원심[^.。]*판단[^.。]*[.。]/g,
                    /따라서[^.。]*[.。]/g,
                    /결국[^.。]*[.。]/g
                ];

                let extracted = "";
                for (const phrase of keyPhrases) {
                    const matches = reasonText.match(phrase);
                    if (matches) {
                        extracted += matches.join(" ");
                        if (extracted.length > 200) break;
                    }
                }

                if (extracted.length > 50) {
                    // Format as "~~라고 판단한 사례"
                    content = extracted.substring(0, 500).trim();
                    if (!content.endsWith("사례") && !content.endsWith("사례.")) {
                        content = content.replace(/[.。]$/, "") + "라고 판단한 사례.";
                    }
                } else {
                    // Just take the first meaningful part of the reason
                    content = reasonText.substring(0, 500).trim();
                }
            }
        }

        return { content, referencedLaws: [lawsText] };
    } catch (e) {
        console.error(`Failed to fetch precedent detail for ID ${id}:`, e);
        return { content: "", referencedLaws: [] };
    }
}

export async function searchPrecedent(query: string, filterKeyword?: string): Promise<LawSearchResult[]> {
    const apiKey = getNationalLawApiKey();

    if (!apiKey) {
        return [];
    }

    try {
        const url = new URL("https://www.law.go.kr/DRF/lawSearch.do");
        url.searchParams.set("OC", apiKey);
        url.searchParams.set("target", "prec");
        url.searchParams.set("type", "XML");
        url.searchParams.set("query", query);
        url.searchParams.set("search", "1"); // 정확도순

        // Fetch more candidates to filter locally
        const displayCount = "20";
        url.searchParams.set("display", displayCount);

        console.log(`Searching National Law API (Precedent) for: "${query}" (Filter: "${filterKeyword || ''}")`);

        const response = await fetch(url.toString());

        if (!response.ok) {
            console.error("National Law API error:", response.status);
            return [];
        }

        const xmlText = await response.text();

        // Regex to extract search results metadata
        const ids = extractTag(xmlText, "판례일련번호");
        const titles = extractTag(xmlText, "사건명");
        const numbers = extractTag(xmlText, "사건번호");
        const dates = extractTag(xmlText, "선고일자");

        // Helper to check if case references CPLA-authorized laws
        const isCPLACase = (title: string, content: string, referencedLaws: string[]): boolean => {
            const combined = title + content + referencedLaws.join(" ");
            return CPLA_LAW_WHITELIST.some(law => combined.includes(law));
        };

        const validResults: LawSearchResult[] = [];
        const laborOnlyResults: LawSearchResult[] = [];

        // Process candidates
        const limit = Math.min(ids.length, 20);

        for (let i = 0; i < limit; i++) {
            const id = ids[i];
            const title = titles[i] || "제목 없음";
            const number = numbers[i] || "";
            const date = dates[i] || "";

            // Fetch detail (now returns { content, referencedLaws })
            const detail = await getPrecedentDetail(id);
            const content = detail.content;
            const referencedLaws = detail.referencedLaws;

            // Skip cases with no content
            if (!content || content.length < 50) {
                continue;
            }

            // 1. CPLA Law Whitelist Validation
            if (!isCPLACase(title, content, referencedLaws)) {
                // console.log(`Skipped non-CPLA case: ${title}`);
                continue;
            }

            const resultItem = { title, caseNumber: number, judgeDate: date, content };

            // 2. Keyword Filter (if provided)
            let isExactMatch = true;
            if (filterKeyword) {
                if (!title.includes(filterKeyword) && !content.includes(filterKeyword)) {
                    isExactMatch = false;
                }
            }

            if (isExactMatch) {
                validResults.push(resultItem);
            } else {
                laborOnlyResults.push(resultItem);
            }
        }

        // Combine: Exact Matches first, then CPLA-valid fallbacks
        const finalResults = [...validResults];

        // Fill up to 4 with labor-only results if needed
        if (finalResults.length < 4) {
            const needed = 4 - finalResults.length;
            finalResults.push(...laborOnlyResults.slice(0, needed));
        }

        // Limit to 4
        const top4 = finalResults.slice(0, 4);

        console.log(`Returning ${top4.length} results (Exact: ${validResults.length}, CPLAFallback: ${top4.length - validResults.length}).`);
        return top4;

    } catch (error) {
        console.error("Precedent search error:", error);
        return [];
    }
}
