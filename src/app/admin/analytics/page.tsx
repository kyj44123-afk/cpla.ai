"use client";

import React, { useEffect, useState } from "react";
import { Users, MessageSquare, Phone } from "lucide-react";

interface Contact {
    id: string;
    data: { contact: string; initial_query: string };
    created_at: string;
}

interface Session {
    id: string;
    created_at: string;
    messages: { role: string; content: string }[];
}

export default function AnalyticsPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"contacts" | "sessions">("contacts");

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/admin/analytics");
                const data = await res.json();
                setContacts(data.contacts || []);
                setSessions(data.sessions || []);
            } catch (e) {
                console.error("Failed to fetch analytics:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">분석</h1>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("contacts")}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === "contacts"
                            ? "border-slate-900 text-slate-900"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Phone className="w-5 h-5" />
                    연락처 ({contacts.length})
                </button>
                <button
                    onClick={() => setActiveTab("sessions")}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === "sessions"
                            ? "border-slate-900 text-slate-900"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <MessageSquare className="w-5 h-5" />
                    세션 ({sessions.length})
                </button>
            </div>

            {loading ? (
                <p className="text-slate-500">로딩 중...</p>
            ) : activeTab === "contacts" ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {contacts.length === 0 ? (
                        <p className="p-6 text-slate-500">수집된 연락처가 없습니다.</p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">연락처</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">초기 질문</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-500">등록일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((contact) => (
                                    <tr key={contact.id} className="border-t border-slate-100">
                                        <td className="px-6 py-4 text-slate-800 font-medium">{contact.data.contact}</td>
                                        <td className="px-6 py-4 text-slate-600 max-w-md truncate">{contact.data.initial_query}</td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(contact.created_at).toLocaleString("ko-KR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {sessions.length === 0 ? (
                        <p className="text-slate-500">세션이 없습니다.</p>
                    ) : (
                        sessions.map((session) => (
                            <div key={session.id} className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-mono text-sm text-slate-500">{session.id.slice(0, 8)}...</h3>
                                    <span className="text-sm text-slate-500">
                                        {new Date(session.created_at).toLocaleString("ko-KR")}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {session.messages.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg ${msg.role === "user"
                                                    ? "bg-slate-100 text-slate-800"
                                                    : "bg-blue-50 text-slate-700"
                                                }`}
                                        >
                                            <span className="text-xs font-medium text-slate-500 uppercase">
                                                {msg.role === "user" ? "사용자" : "AI"}
                                            </span>
                                            <p className="mt-1 text-sm line-clamp-3">{msg.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
