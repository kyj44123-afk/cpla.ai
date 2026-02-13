"use client";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">설정</h1>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-3">설정 비활성화</h2>
                <p className="text-slate-600 text-sm">
                    현재 관리자 설정 화면의 프로필 사진 및 API 값 입력 기능은 사용하지 않아 비활성화되었습니다.
                </p>
            </div>
        </div>
    );
}
