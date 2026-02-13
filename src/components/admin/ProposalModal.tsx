"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Download, Wand2, Loader2, Check, MessageSquare } from "lucide-react";
// @ts-ignore removed static import

interface ProposalModalProps {
    inquiry: {
        id: string;
        contact: string;
        name?: string;
        query: string;
        created_at: string;
    };
    onClose: () => void;
}

type ManagedService = {
    name: string;
    description: string;
    keywords?: string[];
};

const FALLBACK_SERVICE_TYPES = [
    "부당해고 구제신청",
    "임금체불 진정",
    "노동위원회 사건",
    "직장 내 괴롭힘 상담",
    "직장 내 성희롱",
    "조직문화 컨설팅",
    "동기부여 컨설팅",
    "산재 보상 신청",
    "법률 자문 (1회)",
    "법률 자문 (월정액)",
    "규정 정비 컨설팅",
];

function normalizeText(value: string): string {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function compactText(value: string): string {
    return normalizeText(value).replace(/[^0-9a-z가-힣]/g, "");
}

function inferBestServiceType(query: string, services: ManagedService[]): string | null {
    const normalizedQuery = normalizeText(query);
    const compactQuery = compactText(query);
    if (!normalizedQuery) return null;

    let best: { name: string; score: number } | null = null;
    for (const service of services) {
        const serviceName = normalizeText(service.name);
        const compactServiceName = compactText(service.name);
        let score = 0;

        if (normalizedQuery.includes(serviceName)) score += 10;
        if (compactQuery && compactServiceName && compactQuery.includes(compactServiceName)) score += 14;

        const nameTokens = serviceName.split(" ").filter((token) => token.length >= 2);
        for (const token of nameTokens) {
            if (normalizedQuery.includes(token)) score += 2;
            if (compactQuery.includes(compactText(token))) score += 2;
        }

        for (const keyword of service.keywords || []) {
            const key = normalizeText(keyword);
            const compactKey = compactText(keyword);
            if (!key) continue;
            if (normalizedQuery.includes(key)) score += 3;
            if (compactKey && compactQuery.includes(compactKey)) score += 4;
        }

        if (!best || score > best.score) {
            best = { name: service.name, score };
        }
    }

    if (!best || best.score <= 0) return null;
    return best.name;
}

export function ProposalModal({ inquiry, onClose }: ProposalModalProps) {
    const [step, setStep] = useState<"input" | "preview">("input");
    const [loading, setLoading] = useState(false);
    const [proposalContent, setProposalContent] = useState("");
    const [serviceOptions, setServiceOptions] = useState<string[]>([]);
    const [serviceMetadata, setServiceMetadata] = useState<ManagedService[]>([]);

    // Inputs
    const [serviceType, setServiceType] = useState(FALLBACK_SERVICE_TYPES[0]);
    const [customServiceType, setCustomServiceType] = useState("");

    // Derived service type for generation
    const finalServiceType = serviceType === "기타" ? customServiceType : serviceType;
    const [retainerFee, setRetainerFee] = useState<number>(0);
    const [progressFee, setProgressFee] = useState<number>(0);
    const [successFee, setSuccessFee] = useState<number>(0);

    const allServiceOptions = useMemo(() => {
        const base = serviceOptions.length > 0 ? serviceOptions : FALLBACK_SERVICE_TYPES;
        return [...base, "기타"];
    }, [serviceOptions]);

    useEffect(() => {
        const fetchServiceOptions = async () => {
            try {
                const res = await fetch("/api/admin/services");
                if (!res.ok) return;
                const data = (await res.json()) as {
                    workerServices?: ManagedService[];
                    employerServices?: ManagedService[];
                };

                const merged = [...(data.workerServices || []), ...(data.employerServices || [])]
                    .filter((item) => item?.name)
                    .map((item) => ({
                        name: item.name.trim(),
                        description: item.description || "",
                        keywords: Array.isArray(item.keywords) ? item.keywords : [],
                    }));

                const uniqueByName = new Map<string, ManagedService>();
                for (const service of merged) {
                    if (!uniqueByName.has(service.name)) {
                        uniqueByName.set(service.name, service);
                    }
                }
                const uniqueServices = Array.from(uniqueByName.values());
                if (uniqueServices.length === 0) return;

                setServiceMetadata(uniqueServices);
                const names = uniqueServices.map((service) => service.name);
                setServiceOptions(names);

                const inferred = inferBestServiceType(inquiry.query || "", uniqueServices);
                if (inferred && names.includes(inferred)) {
                    setServiceType(inferred);
                    return;
                }
                if (!names.includes(serviceType)) {
                    setServiceType(names[0]);
                }
            } catch (error) {
                console.error("Failed to load proposal service options:", error);
            }
        };

        void fetchServiceOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inquiry.query]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Simulate brief delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            const { PROPOSAL_TEMPLATE } = await import("@/lib/proposalTemplate");

            const today = new Date();
            const dateStr = today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
            const dateNoDash = today.toISOString().slice(0, 10).replace(/-/g, "");
            const totalFee = (retainerFee + progressFee + successFee).toLocaleString();

            let content = PROPOSAL_TEMPLATE
                .replace(/{{NAME}}/g, inquiry.name || "고객")
                .replace(/{{CONTACT}}/g, inquiry.contact)
                .replace(/{{DATE}}/g, dateStr)
                .replace(/{{DATE_NODASH}}/g, dateNoDash)
                .replace(/{{SERVICE_TYPE}}/g, finalServiceType)
                .replace(/{{FEE_RETAINER}}/g, retainerFee.toLocaleString())
                .replace(/{{FEE_PROGRESS}}/g, progressFee.toLocaleString())
                .replace(/{{FEE_SUCCESS}}/g, successFee.toLocaleString())
                .replace(/{{FEE_TOTAL}}/g, totalFee);

            setProposalContent(content);
            setStep("preview");
        } catch (error) {
            console.error(error);
            alert("제안서 생성 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        // Use Native Browser Print - avoids all html2canvas CSS parsing issues
        const element = document.getElementById("proposal-content");
        if (!element) {
            alert("제안서 내용을 찾을 수 없습니다.");
            return;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>제안서_${inquiry.name || "고객"}_${inquiry.contact}</title>
                <style>
                    @media print {
                        @page { margin: 10mm; size: A4 portrait; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                    body { 
                        margin: 0; 
                        padding: 20px;
                        font-family: "Malgun Gothic", "맑은 고딕", sans-serif;
                        background: white;
                    }
                </style>
            </head>
            <body>
                ${proposalContent}
            </body>
            </html>
        `);
        printWindow.document.close();

        // Wait for content to render, then trigger print
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
            // Close window after print dialog closes
            printWindow.onafterprint = () => printWindow.close();
        };

        // Fallback for browsers that don't fire onload properly
        setTimeout(() => {
            if (printWindow && !printWindow.closed) {
                printWindow.focus();
                printWindow.print();
            }
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {step === "input" ? "제안서설정" : "제안서 미리보기"}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {inquiry.name ? `${inquiry.name} 님에게` : `${inquiry.contact} 님에게`} 보낼 제안서입니다.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {step === "input" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Context */}
                            <div className="space-y-6">
                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        문의 내용
                                    </h3>
                                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                                        {inquiry.query}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Inputs */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        서비스 유형
                                    </label>
                                    <select
                                        value={serviceType}
                                        onChange={(e) => setServiceType(e.target.value)}
                                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 bg-white"
                                    >
                                        {allServiceOptions.map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                    {serviceMetadata.length > 0 && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            서비스 관리 목록과 자동 연동됩니다. 신규 서비스 추가 시 이 목록에도 자동 반영됩니다.
                                        </p>
                                    )}
                                    {serviceType === "기타" && (
                                        <input
                                            type="text"
                                            placeholder="직접 입력"
                                            value={customServiceType}
                                            onChange={(e) => setCustomServiceType(e.target.value)}
                                            className="w-full mt-2 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                                        />
                                    )}
                                </div>

                                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-sm font-bold text-slate-800 mb-2">비용 설정 (단위: 원)</h3>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            착수금 (Retainer Fee)
                                        </label>
                                        <input
                                            type="number"
                                            value={retainerFee}
                                            onChange={(e) => setRetainerFee(Number(e.target.value))}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 text-right font-mono"
                                            step="10000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            중도금 (Progress Payment)
                                        </label>
                                        <input
                                            type="number"
                                            value={progressFee}
                                            onChange={(e) => setProgressFee(Number(e.target.value))}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 text-right font-mono"
                                            step="10000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            성공보수 (Success Fee)
                                        </label>
                                        <input
                                            type="number"
                                            value={successFee}
                                            onChange={(e) => setSuccessFee(Number(e.target.value))}
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 text-right font-mono"
                                            step="10000"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm border border-slate-200 min-h-[500px]">
                            <div
                                id="proposal-content"
                                className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-700"
                                dangerouslySetInnerHTML={{ __html: proposalContent }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                    {step === "input" ? (
                        <>
                            <button onClick={onClose} className="text-slate-500 hover:text-slate-700 px-4">
                                취소
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="bg-[#1a4f75] text-white px-6 py-3 rounded-lg hover:bg-[#153d5a] transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        생성 중...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5" />
                                        제안서 생성하기
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setStep("input")}
                                className="text-slate-500 hover:text-slate-700 px-4"
                            >
                                다시 수정하기
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                >
                                    닫기
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    className="bg-[#E97132] text-white px-6 py-3 rounded-lg hover:bg-[#D05F20] transition-colors flex items-center gap-2 shadow-lg shadow-orange-100"
                                >
                                    <Download className="w-5 h-5" />
                                    PDF 다운로드
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
