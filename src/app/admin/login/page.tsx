"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        router.push(redirect);
        router.refresh();
        return;
      }

      if (res.status === 401) {
        setError("비밀번호가 올바르지 않습니다.");
      } else if (res.status === 429) {
        setError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.");
      } else if (res.status === 500) {
        setError("서버 설정 오류입니다. 관리자에게 문의해 주세요.");
      } else {
        setError(data?.error || "로그인에 실패했습니다.");
      }
    } catch {
      setError("로그인 중 네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            <span className="text-[#E97132]">CPLA</span> Admin
          </h1>
          <p className="text-slate-500 mt-2">관리자 로그인</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-500"
              placeholder="관리자 비밀번호를 입력해 주세요"
              autoFocus
            />
          </div>

          {error ? <p className="text-red-500 text-sm">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? "확인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md animate-pulse">
            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4" />
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto mb-4" />
            <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
