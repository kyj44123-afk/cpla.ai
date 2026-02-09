"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ResultViewProps {
    answer: string;
    precedents?: { title: string; caseNumber?: string; judgeDate?: string; content: string }[];
    onSufficient: () => void;
    onNeedVerification: () => void;
    isAnswerComplete: boolean;
}

export function ResultView({ answer, precedents, onSufficient, onNeedVerification, isAnswerComplete }: ResultViewProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col w-full bg-white relative pt-24 px-4 md:px-12 pb-24 md:pb-12 min-h-screen"
        >
            <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-12">
                {/* Left Column: AI Answer */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Box 1: AI Answer */}
                    <div>
                        <h2 className="text-3xl font-bold text-[#1a4f75] mb-4">AI&apos;s ANSWER</h2>
                        <div className="border border-slate-200 p-8 bg-white overflow-y-auto max-h-[50vh] whitespace-pre-wrap leading-relaxed text-slate-700 shadow-sm">
                            {answer}
                        </div>
                    </div>
                </div>

                {/* Right Column: Decision Buttons - positioned to align with middle of answer */}
                <div className="w-full md:w-[400px] flex flex-col justify-start md:mt-[10vh] items-center md:items-start space-y-8 flex-shrink-0 min-h-[300px]">
                    <AnimatePresence>
                        {isAnswerComplete && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="w-full"
                            >
                                <div className="mb-8 text-center md:text-left">
                                    <h3 className="text-base md:text-2xl font-bold text-slate-800 mb-4 leading-snug break-keep tracking-tight">
                                        AI의 답변은 만족스러우신가요?<br />
                                        아니면, <span className="text-[#E97132]">전문가</span>의 검증이 필요한가요?
                                    </h3>
                                    <p className="text-slate-500 text-sm">
                                        아래 선택지 중 하나를 클릭·터치해주세요
                                    </p>
                                </div>

                                <div className="w-full space-y-4">
                                    <button
                                        onClick={onSufficient}
                                        className="w-full border border-slate-300 py-4 text-center hover:bg-slate-50 transition-colors text-slate-700"
                                    >
                                        충분한 답변이 되었어요.
                                    </button>
                                    <button
                                        onClick={onNeedVerification}
                                        className="w-full border border-slate-300 py-4 text-center hover:bg-slate-50 transition-colors text-slate-700"
                                    >
                                        <span className="text-[#E97132]">전문가</span>의 검증이 필요해요.
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Mobile Fixed Bottom Bar (Only shows when answer is complete) */}
            <AnimatePresence>
                {isAnswerComplete && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
                    >
                        <div className="flex gap-3">
                            <button
                                onClick={onSufficient}
                                className="flex-1 border border-slate-300 py-3 text-center active:bg-slate-50 text-slate-700 text-sm font-medium rounded-sm"
                            >
                                충분해요
                            </button>
                            <button
                                onClick={onNeedVerification}
                                className="flex-1 bg-[#1a4f75] text-white py-3 text-center active:bg-[#154060] text-sm font-medium rounded-sm"
                            >
                                전문가 검증
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Section: Related Precedents (Full Width) */}
            <div className="max-w-7xl mx-auto w-full mt-12 bg-white">
                <div className="border-2 border-[#1a4f75] bg-slate-50 p-6 shadow-md">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-lg font-bold text-[#1a4f75] flex items-center gap-2">
                            ⚖️ 관련 사례 (Related Cases)
                        </h3>
                        <span className="text-xs text-slate-400 text-right">
                            * Keyword로 도출된 사례입니다. 정확하지 않을 수 있습니다.
                        </span>
                    </div>
                    {precedents && precedents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {precedents.map((p, idx) => (
                                <div key={idx} className="flex flex-col gap-3 p-5 bg-white border border-slate-200 rounded-sm shadow-sm h-full hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-[#E97132] font-bold text-lg">{idx + 1}.</span>
                                            <span className="font-bold text-slate-800 text-base line-clamp-1" title={p.title}>{p.title}</span>
                                        </div>
                                    </div>
                                    {p.caseNumber && (
                                        <span className="self-start text-xs font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-500">
                                            {p.caseNumber}
                                        </span>
                                    )}
                                    {/* Summary (content) - Show more lines for full context */}
                                    <div className="text-sm text-slate-600 leading-relaxed flex-1 text-justify break-keep">
                                        {p.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-500 text-sm py-8 text-center">
                            AI는 관련 사례를 확인하지 못했습니다. (검색어와 관련된 노동법 판례가 없을 수 있습니다)
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
