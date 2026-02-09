import OpenAI from "openai";
import { getOpenAIKey } from "./settings";

let openaiInstance: OpenAI | null = null;

export function getOpenAI(): OpenAI {
    const apiKey = getOpenAIKey();

    if (!apiKey) {
        throw new Error("OpenAI API key not configured. Please set it in Admin > Settings.");
    }

    // Create new instance if key changed or not initialized
    if (!openaiInstance) {
        openaiInstance = new OpenAI({ apiKey });
    }

    return openaiInstance;
}

// Reset instance when settings change
export function resetOpenAI(): void {
    openaiInstance = null;
}

// Legacy export for backward compatibility
export const openai = {
    get chat() {
        return getOpenAI().chat;
    },
    get embeddings() {
        return getOpenAI().embeddings;
    }
};
