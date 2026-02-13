"use client";

import React, { useEffect, useState } from "react";
import { Key, Database, Bot, Save, Eye, EyeOff } from "lucide-react";

interface Settings {
    openai_api_key: string;
    national_law_api_key: string;
    supabase_url?: string;
    supabase_service_role_key?: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<Settings>({
        openai_api_key: "",
        national_law_api_key: "",
        supabase_url: "",
        supabase_service_role_key: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [showOpenAI, setShowOpenAI] = useState(false);
    const [showNationalLaw, setShowNationalLaw] = useState(false);
    const [showSupabaseKey, setShowSupabaseKey] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/admin/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    openai_api_key: data.openai_api_key || "",
                    national_law_api_key: data.national_law_api_key || "",
                    supabase_url: data.supabase_url || "",
                    supabase_service_role_key: data.supabase_service_role_key || "",
                });
            }
        } catch (e) {
            console.error("Failed to fetch settings:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setMessage("설정이 저장되었습니다.");
            } else {
                setMessage("저장 중 오류가 발생했습니다.");
            }
        } catch (e) {
            setMessage("저장 중 오류가 발생했습니다.");
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(""), 3000);
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">설정</h1>

            {/* API Keys Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">API 키 설정</h2>

                {loading ? (
                    <p className="text-slate-500">로딩 중...</p>
                ) : (
                    <div className="space-y-6">
                        {/* OpenAI API Key */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Bot className="w-4 h-4" />
                                OpenAI API Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showOpenAI ? "text" : "password"}
                                    value={settings.openai_api_key}
                                    onChange={(e) =>
                                        setSettings({ ...settings, openai_api_key: e.target.value })
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
                                    placeholder="sk-..."
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOpenAI(!showOpenAI)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showOpenAI ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                OpenAI 대시보드에서 API 키를 생성하세요: https://platform.openai.com/api-keys
                            </p>
                        </div>

                        {/* National Law API Key (OC) */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Key className="w-4 h-4" />
                                국가법령정보센터 Open API Client ID (OC)
                            </label>
                            <div className="relative">
                                <input
                                    type={showNationalLaw ? "text" : "password"}
                                    value={settings.national_law_api_key}
                                    onChange={(e) =>
                                        setSettings({ ...settings, national_law_api_key: e.target.value })
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
                                    placeholder="발급받은 OC 값을 입력하세요"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNationalLaw(!showNationalLaw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showNationalLaw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                국가법령정보센터 Open API 활용신청 후 OC 아이디를 입력하세요: https://open.law.go.kr
                            </p>
                        </div>

                        <hr className="border-slate-100 my-4" />

                        {/* Supabase URL */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Database className="w-4 h-4" />
                                Supabase URL
                            </label>
                            <input
                                type="text"
                                value={settings.supabase_url || ""}
                                onChange={(e) =>
                                    setSettings({ ...settings, supabase_url: e.target.value })
                                }
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
                                placeholder="https://your-project.supabase.co"
                            />
                        </div>

                        {/* Supabase Service Role Key */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                                <Key className="w-4 h-4" />
                                Supabase Service Role Key
                            </label>
                            <div className="relative">
                                <input
                                    type={showSupabaseKey ? "text" : "password"}
                                    value={settings.supabase_service_role_key || ""}
                                    onChange={(e) =>
                                        setSettings({ ...settings, supabase_service_role_key: e.target.value })
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-slate-500 font-mono text-sm"
                                    placeholder="service_role secret key"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showSupabaseKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Project Settings &gt; API &gt; service_role secret을 입력하세요. (anon key 아님)
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "저장 중..." : "설정 저장"}
                            </button>
                            {message && (
                                <span className={`text-sm ${message.includes("오류") ? "text-red-500" : "text-green-600"}`}>
                                    {message}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="font-bold text-amber-800 mb-2">⚠️ 보안 참고사항</h3>
                <ul className="text-sm text-amber-700 space-y-1">
                    <li>• API 키는 암호화되어 데이터베이스에 저장됩니다.</li>
                    <li>• 프로덕션 환경에서는 환경변수 사용을 권장합니다.</li>
                    <li>• API 키는 절대 외부에 노출하지 마세요.</li>
                </ul>
            </div>
        </div>
    );
}
