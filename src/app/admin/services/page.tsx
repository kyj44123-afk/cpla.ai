"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import Image from "next/image";

type ManagedService = {
  name: string;
  description: string;
  keywords?: string[];
  workflowSteps?: string[];
  workflowInfographic?: string;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<ManagedService[]>([]);
  const [defaultNames, setDefaultNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywordsText, setKeywordsText] = useState("");

  const customServices = useMemo(
    () => services.filter((s) => !defaultNames.includes(s.name)),
    [services, defaultNames]
  );

  useEffect(() => {
    void fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { services: ManagedService[]; defaults: string[] };
      setServices(Array.isArray(data.services) ? data.services : []);
      setDefaultNames(Array.isArray(data.defaults) ? data.defaults : []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      setMessage("서비스 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) {
      setMessage("서비스명과 설명을 입력해 주세요.");
      return;
    }
    if (services.some((s) => s.name === trimmedName)) {
      setMessage("동일한 서비스명이 이미 존재합니다.");
      return;
    }
    const keywords = keywordsText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    setServices((prev) => [...prev, { name: trimmedName, description: trimmedDescription, keywords }]);
    setName("");
    setDescription("");
    setKeywordsText("");
    setMessage("서비스가 추가되었습니다. 저장 버튼을 눌러 반영하세요.");
  };

  const handleDelete = (nameToDelete: string) => {
    setServices((prev) => prev.filter((s) => s.name !== nameToDelete));
    setMessage("서비스가 삭제되었습니다. 저장 버튼을 눌러 반영하세요.");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = customServices.map((s) => ({
        name: s.name,
        description: s.description,
        keywords: Array.isArray(s.keywords) ? s.keywords : [],
      }));
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: payload }),
      });
      if (!res.ok) throw new Error("save failed");
      setMessage("서비스 목록이 저장되었습니다.");
      await fetchServices();
    } catch (error) {
      console.error("Failed to save services:", error);
      setMessage("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">서비스 관리</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="text-xl font-bold text-slate-800">서비스 추가</h2>
        <div className="grid grid-cols-1 gap-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="서비스명 (예: 부당해고 구제신청 대리)"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="서비스 설명"
            className="w-full h-24 border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <input
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            placeholder="인식 키워드(선택, 콤마 구분) 예: 부당해고, 해고, 징계"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <div>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              서비스 추가
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">현재 서비스 목록</h2>
        {loading ? (
          <p className="text-slate-500">로딩 중...</p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const isDefault = defaultNames.includes(service.name);
              return (
                <div key={service.name} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                      {isDefault && <p className="text-xs text-[#E97132] mt-1">기본 서비스</p>}
                      <p className="text-sm text-slate-600 mt-2">{service.description}</p>
                      {!!service.keywords?.length && (
                        <p className="text-xs text-slate-500 mt-2">키워드: {service.keywords.join(", ")}</p>
                      )}
                      {service.workflowInfographic && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-500 mb-2">자동 생성된 업무 플로우 인포그래픽</p>
                          <Image
                            src={service.workflowInfographic}
                            alt={`${service.name} workflow`}
                            width={900}
                            height={520}
                            unoptimized
                            className="w-full h-auto max-w-xl border border-slate-200 bg-slate-50"
                          />
                        </div>
                      )}
                    </div>
                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => handleDelete(service.name)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "저장 중..." : "목록 저장"}
          </button>
          {message && <span className={`text-sm ${message.includes("오류") ? "text-red-500" : "text-green-600"}`}>{message}</span>}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold text-blue-800 mb-2">안내</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 추가한 서비스는 사용자 상황과 입력 키워드를 기반으로 자동 추천됩니다.</li>
          <li>• 서비스별 업무 플로우는 AI가 서비스명을 기준으로 자동 구성하여 신청 폼에 표시합니다.</li>
          <li>• 기본 서비스(오렌지 표시)는 시스템 기본값으로 유지됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
