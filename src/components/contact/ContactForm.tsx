"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface ContactFormProps {
    onSubmit: (contact: string, name: string) => void;
    serviceName: string;
    workflowSteps: string[];
    workflowInfographic: string;
}

export function ContactForm({ onSubmit, serviceName, workflowSteps, workflowInfographic }: ContactFormProps) {
    const [contact, setContact] = useState("");
    const [name, setName] = useState("");
    const [isAgreed, setIsAgreed] = useState(false);
    const [showAgreementWarning, setShowAgreementWarning] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAgreed) {
            setShowAgreementWarning(true);
            return;
        }
        if (contact.trim() && name.trim()) {
            onSubmit(contact, name);
        } else {
            alert("성함과 연락처를 모두 입력해주세요.");
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center px-4"
        >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
                연락처를 알려주세요.
            </h2>
            <p className="text-slate-500 mb-12">
                서울대학교, 현대자동차 출신 공인노무사가<br />
                친절하게 연락드리겠습니다.
            </p>

            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
                <div className="w-full border border-slate-200 bg-slate-50 p-4 text-left">
                    <p className="text-xs text-slate-500 mb-1">신청 서비스</p>
                    <p className="text-sm font-semibold text-slate-800 mb-3">{serviceName}</p>
                    {workflowInfographic && (
                        <div className="mb-3">
                            <p className="text-xs text-slate-500 mb-2">업무 플로우 인포그래픽</p>
                            <Image
                                src={workflowInfographic}
                                alt={`${serviceName} workflow`}
                                width={900}
                                height={520}
                                unoptimized
                                className="w-full h-auto border border-slate-200 bg-white"
                            />
                        </div>
                    )}
                    <p className="text-xs text-slate-500 mb-2">업무 진행 플로우</p>
                    <ol className="space-y-1">
                        {workflowSteps.map((step, index) => (
                            <li key={`${serviceName}-${index}`} className="text-xs text-slate-700">
                                {index + 1}. {step}
                            </li>
                        ))}
                    </ol>
                </div>

                <div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="성함 (예: 홍길동)"
                        className="w-full bg-white border border-slate-200 rounded-none px-6 py-4 text-center text-lg focus:outline-none focus:border-slate-400 transition-colors"
                        autoFocus
                    />
                </div>
                <div>
                    <input
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="이메일 주소 또는 전화번호"
                        className="w-full bg-white border border-slate-200 rounded-none px-6 py-4 text-center text-lg focus:outline-none focus:border-slate-400 transition-colors"
                    />
                </div>
                <label className="flex items-start gap-2 text-left">
                    <input
                        type="checkbox"
                        checked={isAgreed}
                        onChange={(e) => {
                            setIsAgreed(e.target.checked);
                            if (e.target.checked) setShowAgreementWarning(false);
                        }}
                        className="mt-1"
                    />
                    <span className="text-sm text-slate-700">개인정보 수집·이용에 동의합니다. (필수)</span>
                </label>
                {showAgreementWarning && (
                    <p className="text-xs text-red-600 text-left">
                        미동의 시 서비스 제공이 제한됩니다. 동의 후 신청을 진행해 주세요.
                    </p>
                )}
                <button
                    type="submit"
                    className="w-full mt-4 bg-slate-900 text-white px-12 py-3 hover:bg-slate-800 transition-colors"
                >
                    입력 완료
                </button>
            </form>

            {/* Privacy Notice */}
            <p className="mt-6 text-xs text-slate-400 max-w-md text-center leading-relaxed">
                모든 개인정보는 작성 후 원칙적으로 10일 이내 삭제하며,<br />
                서비스 안내 및 상담 목적 외에는 사용하지 않습니다.
            </p>
        </motion.div>
    );
}
