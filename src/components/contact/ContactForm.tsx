"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface ContactFormProps {
    onSubmit: (contact: string, name: string) => void;
}

export function ContactForm({ onSubmit }: ContactFormProps) {
    const [contact, setContact] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
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
