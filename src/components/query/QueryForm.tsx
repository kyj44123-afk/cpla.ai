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
            className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto"
        >
            <div className="flex-1 flex flex-col justify-start md:justify-center max-w-4xl mx-auto w-full px-4 md:px-8 py-8 md:py-0">
                <div className="text-center mb-6 md:mb-12">
                    <div className="flex items-center justify-center gap-0 mb-2">
                        <h2 className="text-2xl md:text-3xl font-bold"><span className="text-[#E97132]">CPLA</span> <span className="text-gray-700">+ AI</span></h2>
                        <img src="/ai-robot.png" alt="AI Robot" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
                    </div>
                    <p className="text-gray-500 text-sm md:text-base leading-relaxed">
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
                            className="w-full h-40 md:h-48 text-base md:text-2xl p-4 md:p-6 border-2 border-slate-300 focus:border-slate-800 focus:outline-none resize-none rounded-none placeholder:text-slate-300"
                            autoFocus
                        />
                    </div>

                    {/* Contact Link - Moved outside textarea for mobile */}
                    <div className="mt-3 text-center md:text-right">
                        <p className="text-xs md:text-sm text-slate-400 mb-1">
                            텍스트 입력만 가능합니다.
                        </p>
                        <button
                            type="button"
                            onClick={onContactClick}
                            className="text-xs md:text-sm text-[#E97132] hover:underline font-medium leading-relaxed"
                        >
                            준비되어 있는 파일이 있는 경우에는<br className="md:hidden" /> 전문가의 상담을 받아보세요.
                        </button>
                    </div>

                    <div className="mt-3 md:mt-4 text-center text-slate-400 text-xs md:text-sm">
                        상세하게 작성할수록 답변의 정확성이 높아집니다.
                    </div>

                    <div className="mt-8 md:mt-12 flex justify-center gap-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 md:px-8 py-3 text-slate-500 hover:text-slate-800 transition-colors text-sm md:text-base"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-8 md:px-12 py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm md:text-base"
                        >
                            입력 완료
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}

