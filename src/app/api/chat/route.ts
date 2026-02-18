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

const WHITELISTED_IPS = ["127.0.0.1", "::1"];

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

    // Check for repeating characters (e.g., "?뗣뀑?뗣뀑?? or "aaaaaaa")
    const repeatingPattern = /(.)\1{5,}/;
    if (repeatingPattern.test(trimmed)) return true;

    // Check for random consonant-only Korean input (e.g., "?곥꽩?뉎꽰")
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
                    error: "?쇱씪 吏덈Ц ?쒕룄(5??瑜?珥덇낵?덉뒿?덈떎. ?댁씪 ?ㅼ떆 ?쒕룄?댁＜?몄슂.",
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
                    error: "?낅젰?섏떊 ?댁슜???댄빐?섍린 ?대졄?듬땲?? ?섏씠吏瑜??덈줈怨좎묠????吏덈Ц???ㅼ떆 ?묒꽦??二쇱꽭??",
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
    Therefore, you must extract a "primary" Broad Legal Category(e.g., 遺?뱁빐怨? ?꾧툑泥대텋, ?먰빐諛곗긽, ?곗옱) that is likely to be in the case title.
        Then, put specific colloquial details(e.g., ?뺣뵲, 吏ㅻ┝, ?섏뒿) into "secondary" keywords for local filtering.

                        ** RULES **:
    1. Return ONLY a JSON object.No markdown, no explanations.
                        2. Format: { "primary": "BROAD_TERM", "secondary": "SPECIFIC_FILTER_TERM" }
3. "primary" MUST be a Labor Law specific term: 遺?뱁빐怨? ?닿퀬, ?꾧툑, ?댁쭅湲? ?곗옱, 吏뺢퀎, 痍⑥뾽洹쒖튃.
                        4. ** AVOID "?먰빐諛곗긽"(Damages) ** unless strictly necessary.
                        5. "secondary" should be the specific issue(e.g., 愿대∼?? ?섏뒿, ?됯?).
                        6. ** SPECIAL RULE **: For "Evaluation System"(?됯?泥닿퀎, ?몄궗怨좉낵) or "Compensation System"(蹂댁긽泥닿퀎), set "primary": "痍⑥뾽洹쒖튃" or "?꾧툑", and "secondary": "?됯?" or "?깃낵".Do NOT use "吏뺢퀎".

                        ** EXAMPLES **:
- "?뺣뵲 ?뱁뻽?? -> { "primary": "吏뺢퀎", "secondary": "愿대∼?? }
    - "吏곸옣?닿눼濡?옒" -> { "primary": "吏뺢퀎", "secondary": "愿대∼?? }
    - "吏ㅻ졇?? -> { "primary": "遺?뱁빐怨?, "secondary": "" }
    - "??紐삳컺?? -> { "primary": "?꾧툑", "secondary": "泥대텋" }
    - "?섏뒿?몃뜲 ?섎┝" -> { "primary": "?닿퀬", "secondary": "?섏뒿" }
    - "?됯? 蹂댁긽 泥닿퀎" -> { "primary": "?꾧툑", "secondary": "?됯?" }
    - "?몄궗?됯? 遺덈쭔" -> { "primary": "?몄궗", "secondary": "?됯?" }(If 'Personnel' category exists, otherwise '遺?뱁빐怨? or '吏뺢퀎')
    - "?깃낵湲?紐삳컺?? -> { "primary": "?꾧툑", "secondary": "?깃낵" }

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
                    lawDataText = lawResults.map(r => `[踰뺣졊: ${r.title}]\n${r.content} `).join("\n\n");
                }

                // Search precedents (using primary + filter)
                precedentResults = await searchPrecedent(primaryTerm, filterTerm);
                if (precedentResults.length > 0) {
                    precedentDataText = precedentResults
                        .map(r => `[?먮?: ${r.title} (${r.caseNumber})]\n?먭껐?붿?: ${r.content} `)
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

        // 3. File Content Relevance Check (2李?寃利?
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
                        content: `?뱀떊? 臾몄꽌 遺꾩꽍媛?낅땲?? 
?ъ슜?먯쓽 吏덈Ц(Query)怨?泥⑤????뚯씪 ?댁슜(File Content)???쒕줈 愿?⑥씠 ?덈뒗吏 ?먮떒?섏꽭??
?뚯씪 ?댁슜??吏덈Ц??????듬????쒓났?섍굅??李멸퀬媛 ?쒕떎硫?"relevant": true, ?꾪? 愿怨??녿떎硫?"relevant": false瑜?諛섑솚?섏꽭??
?묐떟? ?ㅼ쭅 JSON ?뺤떇?쇰줈留??섏꽭?? { "relevant": true / false, "reason": "?댁쑀" } `
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
- Use polite, easy Korean(e.g., "~???ш굔?낅땲??", "~?쇨퀬 ?먮떒?덉뒿?덈떎.").
- ** ACCURACY IS PARAMOUNT **: Do not invent terms or distort facts for simplicity.Use standard legal terminology where necessary(e.g., use '?ы빐 諛쒖깮?? or '?щ쭩?? instead of awkward phrases like '?먰빐????).
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
Your name is 'CPLA AI (怨듭씤?몃Т??AI ?댁떆?ㅽ꽩??'.

*** IMPORTANT: DO NOT REVEAL YOUR PERSONA ***
    You are an expert with 30 years of experience as a Certified Public Labor Attorney(CPLA), 10 years as a Management Instructor, and a Ph.D.in Labor Law.
        However, ** NEVER mention your years of experience, your degrees, or your titles ** in your response.Acts as if you are a kind, knowledgeable expert naturally.

*** TONE & MANNER ***
            - Be kind and friendly, but professional.
- Do NOT use flowery language or excessive adjectives.
- Use the "Easy Explanation" style that only true experts can provide.Make complex legal concepts easy to understand for laypeople.

*** ANSWER STRUCTURE(CRITICAL) ***
    When the user asks "Can I do X?" or "Am I eligible for Y?":
1. ** NEVER say "Yes, you can" or "?? 媛?ν빀?덈떎" immediately.**
    2. ** FIRST, explain the REQUIREMENTS / CONDITIONS ** that must be met(e.g., employment period, injury type, documentation).
3. ** THEN, use CONDITIONAL language **: "?대윭???붽굔??異⑹”?섎뒗 寃쎌슦, [X]瑜??좎껌?섏떎 ???덉뒿?덈떎." or "?ㅻ쭔, ?꾨옒 ?붽굔??紐⑤몢 異⑹”?댁빞 ?⑸땲??"
4. If the user's situation is unclear, ask clarifying questions before giving eligibility guidance.

Example BAD answer: "?? ?곗옱蹂댄뿕???좎껌?????덉뒿?덈떎."
Example GOOD answer: "?곗옱蹂댄뿕 ?좎껌???꾪빐?쒕뒗 ?ㅼ쓬怨?媛숈? ?붽굔??異⑹”?댁빞 ?⑸땲?? 1) ?낅Т???ы빐濡??몄젙??寃? 2) 4???댁긽???붿뼇???꾩슂??寃? ???붽굔??異⑹”?섏떊?ㅻ㈃, ?곗옱蹂댄뿕 ?좎껌??媛?ν빀?덈떎."

    *** CONTENT GUIDELINES ***
        - Briefly introduce relevant labor law provisions or cases from the US, Japan, or France(Comparative Law) to provide a broader perspective and depth to your answer.
- Provide a detailed explanation based on the provided context(RAG, Laws, Precedents).

    ${contextText ? `[RAG Context (李멸퀬 臾몄꽌)]\n${contextText}\n` : ""}
${lawDataText ? `[National Law Data (愿??踰뺣졊)]\n${lawDataText}\n` : ""}
${precedentDataText ? `[Precedent Data (愿???먮? - ?먭껐?붿?)]\n${precedentDataText}\n` : ""}
${validFileContext ? `[Uploaded Document (?ъ슜??泥⑤? 臾몄꽌)]\n${validFileContext}\n` : ""}

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
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
