export interface KeywordMapping {
    primary: string;
    secondary: string;
}

// Dictionary mapping specific HR/colloquial terms to Labor Law categories
// Key: HR Term, Value: Labor Law Category
const CONCEPT_MAP: Record<string, string> = {
    // HR / Management Terms
    "평가": "취업규칙", // Evaluation often involves rules
    "인사고과": "취업규칙",
    "KPI": "임금",
    "MBO": "임금",
    "연봉": "임금",
    "인센티브": "임금",
    "성과급": "임금",
    "복리후생": "임금",
    "보상": "임금",
    "동기부여": "임금",
    "조직문화": "취업규칙",
    "조직문화컨설팅": "취업규칙",
    "문화개선": "취업규칙",

    // Discipline / Termination
    "시말서": "징계",
    "경위서": "징계",
    "대기발령": "휴직",
    "직위해제": "휴직",
    "권고사직": "해고",
    "명예퇴직": "해고",
    "정리해고": "해고",

    // Safety
    "산재": "산재",
    "다쳤": "산재",
    "교통사고": "산재",
    "우울증": "산재",
    "자살": "산재",
    "자해": "산재",

    // Harassment
    "왕따": "징계",
    "괴롭힘": "징계",
    "폭언": "징계",
    "성희롱": "징계"
};

export function mapKeywords(query: string, aiResult: { primary: string, secondary: string }): KeywordMapping {
    const { primary, secondary } = aiResult;
    const lowerQuery = query.toLowerCase();

    // 1. Complex Combinations (Highest Priority)

    // Evaluation + System/Reform -> Employment Rules (Not Discipline)
    if (lowerQuery.includes("평가") || lowerQuery.includes("고과")) {
        if (lowerQuery.includes("체계") || lowerQuery.includes("개편") || lowerQuery.includes("제도") || lowerQuery.includes("규정")) {
            console.log("[KeywordMapper] Override: Evaluation System -> Employment Rules");
            return { primary: "취업규칙", secondary: "평가" };
        }
        // Evaluation + Money -> Wages
        if (lowerQuery.includes("보상") || lowerQuery.includes("금") || lowerQuery.includes("연봉") || lowerQuery.includes("급여") || lowerQuery.includes("성과")) {
            console.log("[KeywordMapper] Override: Evaluation + Money -> Wages");
            return { primary: "임금", secondary: "평가" };
        }
    }

    // Harassment -> Disciplinary / Damages
    if (lowerQuery.includes("괴롭힘") || lowerQuery.includes("왕따")) {
        // If AI returned "Damages" (손해배상), keep it? 
        // No, user usually wants Labor Board remedy first -> "Disciplinary" or "Correction"
        if (primary !== "징계" && primary !== "산재") {
            console.log("[KeywordMapper] Override: Harassment -> Discipline");
            return { primary: "징계", secondary: "괴롭힘" };
        }
    }

    // 2. Direct Concept Mapping (Medium Priority)
    // If AI's primary category is generic ("Questions", "Personnel", "Other") or clearly wrong
    const weakCategories = ["인사", "기타", "질문", "상담", "일반"];
    if (!primary || weakCategories.includes(primary)) {
        for (const [key, category] of Object.entries(CONCEPT_MAP)) {
            if (lowerQuery.includes(key)) {
                console.log(`[KeywordMapper] Fallback: Found '${key}' -> '${category}'`);
                return { primary: category, secondary: secondary || key };
            }
        }
    }

    // 3. Special Case: "Safety" (Sanjae) is very specific.
    // If query has "dad" (hurt) or "sick", but AI said "Dismissal" (maybe sick leave dismissal?) -> Keep AI if plausible.
    // But if AI said "Wages", it's likely wrong.

    return { primary, secondary };
}
