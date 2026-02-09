"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface QueryFormProps {
    initialQuery: string;
    onSubmit: (query: string) => void;
    onCancel: () => void;
    onContactClick: () => void;
}

export function QueryForm({ initialQuery, onSubmit, onCancel, onContactClick }: QueryFormProps) {
    const [query, setQuery] = useState(initialQuery);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSubmit(query);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
        >
            <div className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full px-8">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-0 mb-2">
                        <h2 className="text-3xl font-bold"><span className="text-[#E97132]">CPLA</span> <span className="text-gray-700">+ AI</span></h2>
                        <img src="/ai-robot.png" alt="AI Robot" className="w-10 h-10 object-contain" />
                    </div>
                    <p className="text-gray-500">
                        공인노무사 디렉터가 직접 모은 DB에 한정해서<br />
                        생성형 AI가 최적의 답변을 제시합니다.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="w-full">
                    <div className="relative">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="입력하세요. ▼"
                            className="w-full h-32 md:h-48 text-lg md:text-2xl p-4 md:p-6 border-2 border-slate-300 focus:border-slate-800 focus:outline-none resize-none rounded-none placeholder:text-slate-300"
                            autoFocus
                        />
                        {/* Contact Link */}
                        <div className="absolute bottom-4 right-4 text-right">
                            <p className="text-sm text-slate-400">
                                텍스트 입력만 가능합니다.
                            </p>
                            <button
                                type="button"
                                onClick={onContactClick}
                                className="text-sm text-[#E97132] hover:underline font-medium"
                            >
                                준비되어 있는 파일이 있는 경우에는 전문가의 상담을 받아보세요.
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 text-center text-slate-400 text-sm">
                        상세하게 작성할수록 답변의 정확성이 높아집니다.
                    </div>

                    <div className="mt-12 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-8 py-3 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-12 py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                        >
                            입력 완료
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
