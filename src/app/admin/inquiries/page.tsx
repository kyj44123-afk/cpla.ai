"use client";

import React, { useEffect, useState } from "react";
import { FileText, MessageSquare, Phone, Calendar, Search } from "lucide-react";
import { ProposalModal } from "@/components/admin/ProposalModal";

interface Inquiry {
    id: string;
    created_at: string;
    contact: string;
    query: string;
    session_id: string;
    status: string;
}

export default function InquiriesPage() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const res = await fetch("/api/admin/inquiries");
            if (res.ok) {
                const data = await res.json();
                setInquiries(data);
            }
        } catch (e) {
            console.error("Failed to fetch inquiries", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredInquiries = inquiries.filter(
        (i) =>
            i.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.query.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">문의 내역</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="연락처 또는 내용 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 text-sm w-64"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">접수일시</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">연락처</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase w-1/2">문의 내용</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    로딩 중...
                                </td>
                            </tr>
                        ) : filteredInquiries.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                    접수된 문의가 없습니다.
                                </td>
                            </tr>
                        ) : (
                            filteredInquiries.map((inquiry) => (
                                <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(inquiry.created_at).toLocaleDateString()}
                                            <span className="text-xs text-slate-400">
                                                {new Date(inquiry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-800 font-medium">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            {inquiry.contact}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="line-clamp-2">{inquiry.query}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setSelectedInquiry(inquiry)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1a4f75] text-white text-xs font-medium rounded hover:bg-[#153d5a] transition-colors"
                                        >
                                            <FileText className="w-3 h-3" />
                                            제안서 작성
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Proposal Modal */}
            {selectedInquiry && (
                <ProposalModal
                    inquiry={selectedInquiry}
                    onClose={() => setSelectedInquiry(null)}
                />
            )}
        </div>
    );
}
