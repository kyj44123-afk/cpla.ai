"use client";

import React, { useState } from 'react';

export function Footer() {
    const [showEmail, setShowEmail] = useState(false);
    const [copied, setCopied] = useState(false);
    const email = "kyj@hyinsa.com";

    const handleContactClick = () => {
        setShowEmail(!showEmail);
        setCopied(false);
    };

    const handleCopyEmail = async () => {
        try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy email:", err);
        }
    };

    return (
        <footer className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-10 pointer-events-none">
            <div className="relative pointer-events-auto">
                <div
                    onClick={handleContactClick}
                    className="text-lg md:text-xl font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                >
                    Contact Us
                </div>
                {showEmail && (
                    <div
                        onClick={handleCopyEmail}
                        className="absolute bottom-full left-0 mb-2 px-4 py-2 bg-white border border-slate-300 shadow-lg rounded cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                        <span className="text-[#E97132] font-medium">{email}</span>
                        <span className="ml-2 text-xs text-slate-400">
                            {copied ? "✓ 복사됨!" : "(클릭하여 복사)"}
                        </span>
                    </div>
                )}
            </div>
            <div className="text-right text-sm md:text-base text-gray-500 pointer-events-auto">
                AI로 증강된 최고의 노동법률 전문가 그룹
            </div>
        </footer>
    );
}
