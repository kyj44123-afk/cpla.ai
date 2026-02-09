"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Bot, Paperclip } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface ChatInterfaceProps {
    initialQuery: string;
    sessionId: string;
}

export function ChatInterface({ initialQuery, sessionId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: "user", content: initialQuery }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const streamResponse = async (msgs: Message[]) => {
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: msgs, sessionId }),
            });

            if (!response.ok) throw new Error("Chat network error");
            if (!response.body) throw new Error("No response body");

            // Add placeholder for assistant
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let text = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                text += chunkValue;

                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (lastMsg.role === "assistant") {
                        lastMsg.content = text;
                    }
                    return newMsgs;
                });
            }
            setIsLoading(false);
        } catch (error) {
            console.error("Stream error:", error);
            setIsLoading(false);
            setMessages(prev => [...prev, { role: "assistant", content: "죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
        }
    };

    // Initial query effect
    useEffect(() => {
        if (initialQuery && isLoading && sessionId) {
            // Check if we already have an assistant response (to avoid double fetch if re-mounted)
            // But here we mount fresh. 
            // We need to assume initialQuery is the only user message.
            streamResponse([{ role: "user", content: initialQuery }]);
        }
    }, [initialQuery, sessionId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: Message = { role: "user", content: input };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        streamResponse(newMessages);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-[calc(100vh-140px)] w-full max-w-4xl mx-auto bg-white"
        >
            {/* Header Info */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">
                    <span className="text-[#E97132]">CPLA</span> + AI
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    공인노무사 디렉터가 직접 모은 DB에 한정해서<br />
                    생성형 AI가 최적의 답변을 제시합니다.
                </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                            ? 'bg-slate-100 text-slate-800 rounded-tr-none'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                            }`}>
                            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                        </div>
                    </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-lg rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="text-center text-xs text-slate-400 mb-2">
                    상세하게 작성할수록 답변의 정확성이 높아집니다.
                </div>
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? "답변을 기다리는 중입니다..." : "입력하세요. ▼"}
                        disabled={isLoading}
                        className="w-full border border-slate-300 rounded-none px-4 py-3 pr-12 focus:outline-none focus:border-slate-500 transition-colors disabled:bg-slate-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
