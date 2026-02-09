"use client";

import React, { useEffect, useState } from "react";
import { FileText, Users, MessageSquare, Clock, Eye, TrendingUp } from "lucide-react";

interface Stats {
  totalSessions: number;
  totalDocuments: number;
  totalContacts: number;
  todaySessions: number;
  recentInteractions: {
    id: string;
    query: string;
    answer: string;
    contact: string | null;
    created_at: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalDocuments: 0,
    totalContacts: 0,
    todaySessions: 0,
    recentInteractions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStats({
          totalSessions: data.totalSessions ?? 0,
          totalDocuments: data.totalDocuments ?? 0,
          totalContacts: data.totalContacts ?? 0,
          todaySessions: data.todaySessions ?? 0,
          recentInteractions: data.recentInteractions ?? [],
        });
      } catch (e) {
        console.error("Failed to fetch stats:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: "오늘 접속", value: stats.todaySessions, icon: TrendingUp, color: "bg-orange-500" },
    { label: "총 세션", value: stats.totalSessions, icon: MessageSquare, color: "bg-blue-500" },
    { label: "등록된 문서", value: stats.totalDocuments, icon: FileText, color: "bg-green-500" },
    { label: "연락처 수집", value: stats.totalContacts, icon: Users, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">대시보드</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
            <div className={`${card.color} p-4 rounded-lg text-white`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="text-2xl font-bold text-slate-800">
                {loading ? "..." : card.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Q&A Interactions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          최근 질문 & 답변
        </h2>
        {loading ? (
          <p className="text-slate-500">로딩 중...</p>
        ) : stats.recentInteractions.length === 0 ? (
          <p className="text-slate-500">아직 상호작용이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {stats.recentInteractions.map((interaction) => (
              <div key={interaction.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs text-slate-400">
                    {new Date(interaction.created_at).toLocaleString("ko-KR")}
                  </span>
                  {interaction.contact && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {interaction.contact}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-1">질문</p>
                    <p className="text-slate-800">{interaction.query}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-blue-600 mb-1">AI 답변</p>
                    <p className="text-slate-700 text-sm line-clamp-3">{interaction.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
