"use client";

import React, { useEffect, useState } from "react";
import { Upload, Trash2, FileText, Plus } from "lucide-react";

interface Document {
    id: string;
    title: string;
    created_at: string;
    chunk_count?: number;
}

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [newDoc, setNewDoc] = useState({ title: "", content: "" });
    const [lawLoading, setLawLoading] = useState(false);
    const [lawForm, setLawForm] = useState({ lawName: "" });
    const [lawResult, setLawResult] = useState<{
        lawName: string;
        totalSaved: number;
        totalPrecedentsSaved: number;
        totalAdmrulsSaved: number;
        savedFiles: { category: "precedent" | "administrative_ruling"; title: string; path: string }[];
    } | null>(null);
    const [lawError, setLawError] = useState("");

    const fetchDocuments = async () => {
        try {
            const res = await fetch("/api/admin/documents");
            const data = await res.json();
            setDocuments(data.documents || []);
        } catch (e) {
            console.error("Failed to fetch documents:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoc.title.trim() || !newDoc.content.trim()) return;

        setUploading(true);
        try {
            const res = await fetch("/api/admin/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDoc),
            });

            if (res.ok) {
                setNewDoc({ title: "", content: "" });
                setShowUpload(false);
                fetchDocuments();
            }
        } catch (e) {
            console.error("Failed to upload document:", e);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 문서를 삭제하시겠습니까?")) return;

        try {
            await fetch(`/api/admin/documents?id=${id}`, { method: "DELETE" });
            fetchDocuments();
        } catch (e) {
            console.error("Failed to delete document:", e);
        }
    };

    const handleLawDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLawError("");
        setLawResult(null);

        if (!lawForm.lawName.trim()) {
            setLawError("법령명을 입력해 주세요.");
            return;
        }

        setLawLoading(true);
        try {
            const res = await fetch("/api/admin/law-download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(lawForm),
            });
            const data = await res.json();

            if (!res.ok) {
                setLawError(data.error || "법령 다운로드에 실패했습니다.");
                return;
            }

            setLawResult({
                lawName: data.lawName,
                totalSaved: data.totalSaved,
                totalPrecedentsSaved: data.totalPrecedentsSaved || 0,
                totalAdmrulsSaved: data.totalAdmrulsSaved || 0,
                savedFiles: data.savedFiles || [],
            });
        } catch (error) {
            console.error("Law download failed:", error);
            setLawError("법령 다운로드 중 오류가 발생했습니다.");
        } finally {
            setLawLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">문서 관리</h1>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    문서 추가
                </button>
            </div>

            {/* Upload Form */}
            {showUpload && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">새 문서 추가</h2>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                문서 제목
                            </label>
                            <input
                                type="text"
                                value={newDoc.title}
                                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                placeholder="예: 부당해고 관련 법률"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                문서 내용
                            </label>
                            <textarea
                                value={newDoc.content}
                                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                                className="w-full h-48 border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
                                placeholder="RAG에 사용될 문서 내용을 입력하세요..."
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                {uploading ? "업로드 중..." : "업로드"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowUpload(false)}
                                className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">인용 판례/행정해석 다운로드</h2>
                <p className="text-sm text-slate-500 mb-4">
                    법령명을 입력하면 해당 법령을 인용하는 판례와 행정해석 자료를 수집해 <code>law-data/</code> 폴더에 TXT로 저장합니다.
                </p>

                <form onSubmit={handleLawDownload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">법령명</label>
                        <input
                            type="text"
                            value={lawForm.lawName}
                            onChange={(e) => setLawForm({ ...lawForm, lawName: e.target.value })}
                            placeholder="예: 근로기준법"
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={lawLoading}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {lawLoading ? "다운로드 중..." : "인용 자료 다운로드"}
                    </button>
                </form>

                {lawError && <p className="mt-4 text-sm text-red-600">{lawError}</p>}

                {lawResult && (
                    <div className="mt-6 border border-indigo-100 bg-indigo-50 rounded-lg p-4">
                        <p className="font-medium text-slate-800">
                            {lawResult.lawName} 인용 자료 {lawResult.totalSaved}건 저장 완료
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                            판례 {lawResult.totalPrecedentsSaved}건, 행정해석 {lawResult.totalAdmrulsSaved}건
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                            {lawResult.savedFiles.map((file) => (
                                <li key={file.path}>
                                    [{file.category === "precedent" ? "판례" : "행정해석"}] {file.title} → <code>{file.path}</code>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    등록된 문서
                </h2>
                {loading ? (
                    <p className="text-slate-500">로딩 중...</p>
                ) : documents.length === 0 ? (
                    <p className="text-slate-500">등록된 문서가 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div>
                                    <h3 className="font-medium text-slate-800">{doc.title}</h3>
                                    <p className="text-sm text-slate-500">
                                        {new Date(doc.created_at).toLocaleString("ko-KR")}
                                        {doc.chunk_count !== undefined && ` · ${doc.chunk_count} chunks`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
