"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import Image from "next/image";

type Audience = "worker" | "employer";

type ManagedService = {
  name: string;
  description: string;
  audience?: Audience;
  keywords?: string[];
  workflowSteps?: string[];
  workflowInfographic?: string;
};

export default function AdminServicesPage() {
  const [workerServices, setWorkerServices] = useState<ManagedService[]>([]);
  const [employerServices, setEmployerServices] = useState<ManagedService[]>([]);
  const [defaultKeys, setDefaultKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [targetAudience, setTargetAudience] = useState<Audience>("worker");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywordsText, setKeywordsText] = useState("");

  const allServices = useMemo(
    () => [...workerServices.map((s) => ({ ...s, audience: "worker" as const })), ...employerServices.map((s) => ({ ...s, audience: "employer" as const }))],
    [workerServices, employerServices]
  );

  useEffect(() => {
    void fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as {
        workerServices: ManagedService[];
        employerServices: ManagedService[];
        defaultKeys: string[];
      };
      setWorkerServices(Array.isArray(data.workerServices) ? data.workerServices : []);
      setEmployerServices(Array.isArray(data.employerServices) ? data.employerServices : []);
      setDefaultKeys(Array.isArray(data.defaultKeys) ? data.defaultKeys : []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      setMessage("서비스 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName || !trimmedDescription) {
      setMessage("서비스명과 설명을 입력해 주세요.");
      return;
    }
    if (allServices.some((s) => s.name === trimmedName && (s.audience || "worker") === targetAudience)) {
      setMessage("동일한 서비스명이 이미 존재합니다.");
      return;
    }
    const keywords = keywordsText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const next = { name: trimmedName, description: trimmedDescription, audience: targetAudience, keywords };
    if (targetAudience === "worker") {
      setWorkerServices((prev) => [...prev, next]);
    } else {
      setEmployerServices((prev) => [...prev, next]);
    }
    setName("");
    setDescription("");
    setKeywordsText("");
    setMessage("서비스가 추가되었습니다. 저장 버튼을 눌러 반영하세요.");
  };

  const removeService = (audience: Audience, nameToDelete: string) => {
    if (audience === "worker") {
      setWorkerServices((prev) => prev.filter((s) => s.name !== nameToDelete));
    } else {
      setEmployerServices((prev) => prev.filter((s) => s.name !== nameToDelete));
    }
    setMessage("서비스가 삭제되었습니다. 저장 버튼을 눌러 반영하세요.");
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage("");
    try {
      const workerCustom = workerServices.filter((s) => !defaultKeys.includes(`worker:${s.name}`));
      const employerCustom = employerServices.filter((s) => !defaultKeys.includes(`employer:${s.name}`));
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workerServices: workerCustom,
          employerServices: employerCustom,
        }),
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

  const renderSection = (title: string, audience: Audience, items: ManagedService[]) => (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      {loading ? (
        <p className="text-slate-500">로딩 중...</p>
      ) : (
        <div className="space-y-3">
          {items.map((service) => {
            const isDefault = defaultKeys.includes(`${audience}:${service.name}`);
            return (
              <div key={`${audience}-${service.name}`} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{service.name}</p>
                    {isDefault && <p className="text-xs text-[#E97132] mt-1">기본 서비스</p>}
                    <p className="text-sm text-slate-600 mt-2">{service.description}</p>
                    {!!service.keywords?.length && <p className="text-xs text-slate-500 mt-2">키워드: {service.keywords.join(", ")}</p>}
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
                      onClick={() => removeService(audience, service.name)}
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
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">서비스 관리</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <h2 className="text-xl font-bold text-slate-800">서비스 추가</h2>
        <div className="grid grid-cols-1 gap-4">
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as Audience)}
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="worker">근로자 대상</option>
            <option value="employer">사업주/인사담당자 대상</option>
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="서비스명"
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
            placeholder="인식 키워드(선택, 콤마 구분)"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
          <div>
            <button
              type="button"
              onClick={addService}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              서비스 추가
            </button>
          </div>
        </div>
      </div>

      {renderSection("근로자 대상 서비스", "worker", workerServices)}
      {renderSection("사업주/인사담당자 대상 서비스", "employer", employerServices)}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={saveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "저장 중..." : "목록 저장"}
        </button>
        {message && <span className={`text-sm ${message.includes("오류") ? "text-red-500" : "text-green-600"}`}>{message}</span>}
      </div>
    </div>
  );
}
