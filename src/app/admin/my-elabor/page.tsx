"use client";

import React, { useMemo, useState } from "react";
import { Search, ExternalLink } from "lucide-react";

type GroupKey = "supreme" | "high" | "district" | "interpretation" | "guidance";

interface ResultItem {
  id: string;
  title: string;
  target: "prec" | "admrul";
  court?: string;
  caseNumber?: string;
  date?: string;
  summary?: string;
}

interface SearchResponse {
  keyword: string;
  total: number;
  groups: Record<GroupKey, ResultItem[]>;
}

const GROUP_LABELS: Record<GroupKey, string> = {
  supreme: "대법원",
  high: "고등법원",
  district: "지방법원",
  interpretation: "행정해석",
  guidance: "지침",
};

const GROUP_ORDER: GroupKey[] = ["supreme", "high", "district", "interpretation", "guidance"];

export default function MyElaborPage() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<GroupKey>("supreme");
  const [history, setHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<GroupKey, boolean>>({
    supreme: true,
    high: true,
    district: true,
    interpretation: true,
    guidance: true,
  });
  const [result, setResult] = useState<SearchResponse | null>(null);

  React.useEffect(() => {
    const raw = localStorage.getItem("my_elabor_keyword_history");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setHistory(parsed.slice(0, 10));
    } catch {
      // no-op
    }
  }, []);

  const enabledGroups = useMemo(
    () => GROUP_ORDER.filter((group) => filters[group]),
    [filters]
  );

  const activeItems = result?.groups[activeTab] || [];

  const persistHistory = (next: string[]) => {
    setHistory(next);
    localStorage.setItem("my_elabor_keyword_history", JSON.stringify(next));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setResult(null);

    const trimmed = keyword.trim();
    if (!trimmed) {
      setError("검색 키워드를 입력해 주세요.");
      return;
    }

    if (enabledGroups.length === 0) {
      setError("최소 1개 설정값을 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/my-elabor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: trimmed, filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "검색에 실패했습니다.");
        return;
      }

      setResult(data);
      const nextHistory = [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, 10);
      persistHistory(nextHistory);

      const firstEnabled = enabledGroups.find((group) => (data.groups[group] || []).length > 0) || enabledGroups[0];
      if (firstEnabled) setActiveTab(firstEnabled);
    } catch (searchError) {
      console.error(searchError);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">My Elabor</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <p className="text-sm text-slate-600">
          검색 키워드와 설정값으로 국가법령정보센터의 관련 판례/행정해석/지침을 최대 50개(각 그룹 10개) 조회합니다.
        </p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">검색 키워드</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 근로기준법 직장 내 괴롭힘"
              className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">설정값</p>
            <div className="flex flex-wrap gap-3">
              {GROUP_ORDER.map((group) => (
                <label key={group} className="inline-flex items-center gap-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                  <input
                    type="checkbox"
                    checked={filters[group]}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [group]: e.target.checked }))}
                  />
                  {GROUP_LABELS[group]}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? "검색 중..." : "검색"}
          </button>
        </form>

        {history.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">최근 검색 키워드</p>
            <div className="flex flex-wrap gap-2">
              {history.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setKeyword(item);
                    setTimeout(() => void handleSearch(), 0);
                  }}
                  className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {enabledGroups.map((group) => {
              const count = result.groups[group]?.length || 0;
              return (
                <button
                  key={group}
                  onClick={() => setActiveTab(group)}
                  className={`px-3 py-2 rounded-lg text-sm ${activeTab === group ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {GROUP_LABELS[group]} ({count})
                </button>
              );
            })}
          </div>

          <p className="text-sm text-slate-500 mb-4">총 {result.total}건</p>

          {activeItems.length === 0 ? (
            <p className="text-slate-500">검색 결과가 없습니다.</p>
          ) : (
            <ul className="space-y-3">
              {activeItems.map((item) => (
                <li key={`${item.target}-${item.id}`} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.target === "prec" ? "판례" : "행정해석"}
                        {item.court ? ` · ${item.court}` : ""}
                        {item.caseNumber ? ` · ${item.caseNumber}` : ""}
                        {item.date ? ` · ${item.date}` : ""}
                      </p>
                      {item.summary && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{item.summary}</p>}
                    </div>
                    <a
                      href={`/api/admin/my-elabor/open?target=${item.target}&id=${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 whitespace-nowrap"
                    >
                      원문 보기
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
