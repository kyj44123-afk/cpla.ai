import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { retrieveContext } from "@/lib/rag";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { searchNationalLaw, searchPrecedent } from "@/lib/nationalLaw";
import { mapKeywords } from "@/lib/keywordMapper";
import { headers } from "next/headers";

// ============================================
// Rate Limiting: In-Memory Store
// ============================================
// Key: IP address, Value: { count: number, resetTime: Date }
const rateLimitStore = new Map<string, { count: number; resetTime: Date }>();

// Whitelist IPs (add your IP here)
const WHITELISTED_IPS = [
    "127.0.0.1",
    "::1", // localhost
    "66.249.66.164", // User's public IP
];

const RATE_LIMIT_MAX = 5; // 5 questions per day

async function getClientIP(request: Request): Promise<string> {
    const headersList = await headers();
    // Try common headers for real IP (behind proxy/load balancer)
    const forwarded = headersList.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = headersList.get("x-real-ip");
    if (realIp) {
        return realIp;
    }
    // Fallback (may not work in all environments)
    return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    if (WHITELISTED_IPS.includes(ip)) {
        return { allowed: true, remaining: 999 };
    }

    const now = new Date();
    const record = rateLimitStore.get(ip);

    if (!record || now > record.resetTime) {
        // Reset at midnight (or 24h from first request)
        const tomorrow = new Date();
        tomorrow.setHours(24, 0, 0, 0);
        rateLimitStore.set(ip, { count: 1, resetTime: tomorrow });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - record.count };
}

// ============================================
// Gibberish Detection
// ============================================
function isLikelyGibberish(text: string): boolean {
    if (!text || text.trim().length < 3) return true;

    const trimmed = text.trim();

    // Check for keyboard smash patterns (random character sequences)
    const koreanRatio = (trimmed.match(/[\uAC00-\uD7A3]/g) || []).length / trimmed.length;
    const englishRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
    const numberRatio = (trimmed.match(/[0-9]/g) || []).length / trimmed.length;
    const specialRatio = (trimmed.match(/[^a-zA-Z0-9\uAC00-\uD7A3\s.,?!]/g) || []).length / trimmed.length;

    // Too many special characters or very low meaningful char ratio
    if (specialRatio > 0.5) return true;
    if (koreanRatio + englishRatio < 0.3 && trimmed.length > 5) return true;

    // Check for repeating characters (e.g., "ㅋㅋㅋㅋㅋ" or "aaaaaaa")
    const repeatingPattern = /(.)\1{5,}/;
    if (repeatingPattern.test(trimmed)) return true;

    // Check for random consonant-only Korean input (e.g., "ㅁㄴㅇㄻ")
    const jamo = (trimmed.match(/[\u3131-\u314E\u314F-\u3163]/g) || []).length;
    if (jamo > trimmed.length * 0.5 && trimmed.length > 3) return true;

    return false;
}

export async function POST(req: Request) {
    try {
        // ========== Rate Limiting ==========
        const clientIP = await getClientIP(req);
        const rateCheck = checkRateLimit(clientIP);

        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    error: "일일 질문 한도(5회)를 초과했습니다. 내일 다시 시도해주세요.",
                    limitExceeded: true
                },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { messages, sessionId } = body;
        const lastMessage = messages[messages.length - 1];

        if (!lastMessage) {
            return NextResponse.json({ error: "Missing messages" }, { status: 400 });
        }

        // ========== Gibberish Detection ==========
        if (isLikelyGibberish(lastMessage.content)) {
            return NextResponse.json(
                {
                    error: "입력하신 내용을 이해하기 어렵습니다. 페이지를 새로고침한 후 질문을 다시 작성해 주세요.",
                    gibberish: true
                },
                { status: 400 }
            );
        }

        // 0. Save User Message to DB (Fire and forget, or await)
        if (sessionId) {
            const supabase = getSupabaseAdmin();
            await supabase.from("chat_messages").insert({
                session_id: sessionId,
                role: "user",
                content: lastMessage.content,
            });
        }

        // 1. Retrieve Context (RAG) - Skip if no database
        let contextText = "";
        try {
            const contextChunks = await retrieveContext(lastMessage.content);
            contextText = contextChunks.map((chunk: any) => chunk.content).join("\n\n");
        } catch (e) {
            console.log("RAG context retrieval skipped (no database configured)");
        }

        // 2. Search National Law Database (Statutes & Precedents)
        let lawDataText = "";
        let precedentDataText = "";
        let precedentResults: any[] = [];
        try {
            // 0. Keyword Extraction for better search results
            console.log(`Starting keyword extraction for: ${lastMessage.content} `);
            const openai = getOpenAI();
            const keywordResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `You are a 'Legal Search Terms Translator'.context: user is asking a labor law question.
                        Your goal is to convert the user's colloquial language into a structured JSON for searching the National Law Information Center.

    ** STRATEGY **:
                        The legal search engine only finds cases where the keyword appears in the TITLE.
    Therefore, you must extract a "primary" Broad Legal Category(e.g., 부당해고, 임금체불, 손해배상, 산재) that is likely to be in the case title.
        Then, put specific colloquial details(e.g., 왕따, 짤림, 수습) into "secondary" keywords for local filtering.

                        ** RULES **:
    1. Return ONLY a JSON object.No markdown, no explanations.
                        2. Format: { "primary": "BROAD_TERM", "secondary": "SPECIFIC_FILTER_TERM" }
3. "primary" MUST be a Labor Law specific term: 부당해고, 해고, 임금, 퇴직금, 산재, 징계, 취업규칙.
                        4. ** AVOID "손해배상"(Damages) ** unless strictly necessary.
                        5. "secondary" should be the specific issue(e.g., 괴롭힘, 수습, 평가).
                        6. ** SPECIAL RULE **: For "Evaluation System"(평가체계, 인사고과) or "Compensation System"(보상체계), set "primary": "취업규칙" or "임금", and "secondary": "평가" or "성과".Do NOT use "징계".

                        ** EXAMPLES **:
- "왕따 당했어" -> { "primary": "징계", "secondary": "괴롭힘" }
    - "직장내괴롭힘" -> { "primary": "징계", "secondary": "괴롭힘" }
    - "짤렸어" -> { "primary": "부당해고", "secondary": "" }
    - "돈 못받음" -> { "primary": "임금", "secondary": "체불" }
    - "수습인데 잘림" -> { "primary": "해고", "secondary": "수습" }
    - "평가 보상 체계" -> { "primary": "임금", "secondary": "평가" }
    - "인사평가 불만" -> { "primary": "인사", "secondary": "평가" }(If 'Personnel' category exists, otherwise '부당해고' or '징계')
    - "성과급 못받음" -> { "primary": "임금", "secondary": "성과" }

Input: "${lastMessage.content}"`
                    },
                    { role: "user", content: lastMessage.content }
                ],
                temperature: 0.1, // precision
                response_format: { type: "json_object" }
            });

            const searchJson = JSON.parse(keywordResponse.choices[0].message.content || "{}");
            console.log("Extracted Keywords (AI):", searchJson); // Debug log

            // Refine keywords using comprehensive mapper
            const { primary: primaryTerm, secondary: filterTerm } = mapKeywords(lastMessage.content, {
                primary: searchJson.primary || "",
                secondary: searchJson.secondary || ""
            });

            console.log(`Legal Translator(Refined): Primary = "${primaryTerm}", Filter = "${filterTerm}"`);

            if (primaryTerm) {
                // Search laws (using primary)
                const lawResults = await searchNationalLaw(primaryTerm);
                if (lawResults.length > 0) {
                    lawDataText = lawResults.map(r => `[법령: ${r.title}]\n${r.content} `).join("\n\n");
                }

                // Search precedents (using primary + filter)
                precedentResults = await searchPrecedent(primaryTerm, filterTerm);
                if (precedentResults.length > 0) {
                    precedentDataText = precedentResults
                        .map(r => `[판례: ${r.title} (${r.caseNumber})]\n판결요지: ${r.content} `)
                        .join("\n\n");
                } else {
                    console.log("No precedents found even after fallback.");
                }
            } else {
                console.log("No primary legal term extracted.");
            }

        } catch (e) {
            console.log(`National Law search skipped: ${e} `);
        }

        // 3. File Content Relevance Check (2차 검증)
        const { fileContent } = body; // This "body" call may fail if stream already read? No, body was read at start.
        // Wait, 'body' variable is available from line 107.

        let validFileContext = "";

        if (fileContent) {
            const openai = getOpenAI();
            const relevanceCheck = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: `당신은 문서 분석가입니다. 
사용자의 질문(Query)과 첨부된 파일 내용(File Content)이 서로 관련이 있는지 판단하세요.
파일 내용이 질문에 대한 답변을 제공하거나 참고가 된다면 "relevant": true, 전혀 관계 없다면 "relevant": false를 반환하세요.
응답은 오직 JSON 형식으로만 하세요: { "relevant": true / false, "reason": "이유" } `
                    },
                    {
                        role: "user",
                        content: `Query: ${lastMessage.content} \n\nFile Content(truncated): ${fileContent.slice(0, 2000)} `
                    }
                ],
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(relevanceCheck.choices[0].message.content || "{}");
            if (result.relevant) {
                validFileContext = fileContent;
            }
        }

        // 3. AI Summarization for Precedents (New: Consumer-friendly rewrite)
        let processedPrecedents = precedentResults;
        const openai = getOpenAI(); // Initialize here for use in summarization AND main response

        if (precedentResults.length > 0) {
            console.log("Summarizing precedents for consumer friendliness...");
            try {
                // Determine model for summarization (use 4o-mini for speed/cost if available, or just use main model)
                const summaryModel = "gpt-4o";

                // Process in parallel
                processedPrecedents = await Promise.all(precedentResults.map(async (p) => {
                    try {
                        const openai = getOpenAI(); // Re-initialize or pass if needed, assuming it's cheap
                        const summaryResponse = await openai.chat.completions.create({
                            model: summaryModel,
                            messages: [
                                {
                                    role: "system",
                                    content: `You are a legal expert summarizing cases for a layperson.
Your goal is to rewrite the provided legal text(Precedent Summary) into a consumer - friendly format.

** INPUT **:
- User Question: "${lastMessage.content}"
    - Precedent Title: "${p.title}"
        - Precedent Content: "${(p.content || "").substring(0, 1000)}"

            ** OUTPUT FORMAT **:
1. ** Summary **: Write a 2 - 3 sentence summary explaining "What happened" and "What was the judgment" in simple Korean.
2. ** Relevance **: Briefly explain why this case is relevant to the User's Question.

    ** RULES **:
- Keep it under 200 characters total.
- Use polite, easy Korean(e.g., "~한 사건입니다.", "~라고 판단했습니다.").
- ** ACCURACY IS PARAMOUNT **: Do not invent terms or distort facts for simplicity.Use standard legal terminology where necessary(e.g., use '재해 발생일' or '사망일' instead of awkward phrases like '자해한 날').
- Remove legal jargon * only * if it doesn't lose meaning.
    - ** Output ONLY the summarized text.** Do not include labels like "Summary:".`
                                },
                            ],
                            temperature: 0.1,
                            max_tokens: 300,
                        });

                        const summary = summaryResponse.choices[0]?.message?.content?.trim();
                        return {
                            ...p,
                            content: summary || p.content // Fallback to original if empty
                        };
                    } catch (e) {
                        console.error("Precedent summarization failed for one item:", e);
                        return p; // Return original on failure
                    }
                }));
            } catch (e) {
                console.error("Batch summarization failed:", e);
                // Fallback to original
            }
        }

        // 4. Build System Prompt (Updated as requested)
        let systemPrompt = `You are a helpful AI assistant for a Certified Public Labor Attorney(CPLA) in Korea. 
Your name is 'CPLA AI (공인노무사 AI 어시스턴트)'.

*** IMPORTANT: DO NOT REVEAL YOUR PERSONA ***
    You are an expert with 30 years of experience as a Certified Public Labor Attorney(CPLA), 10 years as a Management Instructor, and a Ph.D.in Labor Law.
        However, ** NEVER mention your years of experience, your degrees, or your titles ** in your response.Acts as if you are a kind, knowledgeable expert naturally.

*** TONE & MANNER ***
            - Be kind and friendly, but professional.
- Do NOT use flowery language or excessive adjectives.
- Use the "Easy Explanation" style that only true experts can provide.Make complex legal concepts easy to understand for laypeople.

*** ANSWER STRUCTURE(CRITICAL) ***
    When the user asks "Can I do X?" or "Am I eligible for Y?":
1. ** NEVER say "Yes, you can" or "네, 가능합니다" immediately.**
    2. ** FIRST, explain the REQUIREMENTS / CONDITIONS ** that must be met(e.g., employment period, injury type, documentation).
3. ** THEN, use CONDITIONAL language **: "이러한 요건을 충족하는 경우, [X]를 신청하실 수 있습니다." or "다만, 아래 요건을 모두 충족해야 합니다."
4. If the user's situation is unclear, ask clarifying questions before giving eligibility guidance.

Example BAD answer: "네, 산재보험을 신청할 수 있습니다."
Example GOOD answer: "산재보험 신청을 위해서는 다음과 같은 요건을 충족해야 합니다: 1) 업무상 재해로 인정될 것, 2) 4일 이상의 요양이 필요할 것. 이 요건을 충족하신다면, 산재보험 신청이 가능합니다."

    *** CONTENT GUIDELINES ***
        - Briefly introduce relevant labor law provisions or cases from the US, Japan, or France(Comparative Law) to provide a broader perspective and depth to your answer.
- Provide a detailed explanation based on the provided context(RAG, Laws, Precedents).

    ${contextText ? `[RAG Context (참고 문서)]\n${contextText}\n` : ""}
${lawDataText ? `[National Law Data (관련 법령)]\n${lawDataText}\n` : ""}
${precedentDataText ? `[Precedent Data (관련 판례 - 판결요지)]\n${precedentDataText}\n` : ""}
${validFileContext ? `[Uploaded Document (사용자 첨부 문서)]\n${validFileContext}\n` : ""}

If the provided precedent data is not relevant to the user's question, you may ignore it.
    `;

        // 5. Stream Response with Headers
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
                    ],
                    stream: true,
                });

                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) {
                        controller.enqueue(encoder.encode(content));
                    }
                }

                controller.close();
            },
        });

        // Serialize precedents for header
        // Encode in Base64 or just URI encode to be safe with headers (utf-8 characters)
        // CRITICAL: Truncate content to avoid HPE_HEADER_OVERFLOW (Limit to 1200 chars * 4 = ~4.8KB + overhead < 8KB)
        const headerPrecedents = (processedPrecedents || []).map((p: any) => ({
            ...p,
            content: (p.content || "").substring(0, 1200) + (p.content?.length > 1200 ? "..." : "")
        }));

        const precedentsJson = JSON.stringify(headerPrecedents);
        const apiHeaderValue = Buffer.from(precedentsJson).toString("base64");

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "X-CPLA-Precedents": apiHeaderValue,
                "Access-Control-Expose-Headers": "X-CPLA-Precedents"
            },
        });

    } catch (error: any) {
        // ... err handling
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
