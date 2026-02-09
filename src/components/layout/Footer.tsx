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
        <footer className="w-full p-4 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-0 z-10 mt-auto">
            <div className="relative">
                <div
                    onClick={handleContactClick}
                    className="text-base md:text-xl font-medium text-gray-700 cursor-pointer hover:text-gray-900 transition-colors"
                >
                    Contact Us
                </div>
                {showEmail && (
                    <div
                        onClick={handleCopyEmail}
                        className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-white border border-slate-300 shadow-lg rounded cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap text-sm"
                    >
                        <span className="text-[#E97132] font-medium">{email}</span>
                        <span className="ml-2 text-xs text-slate-400">
                            {copied ? "✓ 복사됨!" : "(클릭하여 복사)"}
                        </span>
                    </div>
                )}
            </div>
            <div className="text-xs md:text-base text-gray-500">
                AI로 증강된 최고의 노동법률 전문가 그룹
            </div>
        </footer>
    );
}

