"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { ProfileRole } from "@/types/database";

const ROLE_OPTIONS: { value: ProfileRole; label: string }[] = [
  { value: "lawyer", label: "변호사" },
  { value: "labor_attorney", label: "노무사" },
  { value: "tax_accountant", label: "세무사" },
  { value: "patent_attorney", label: "변리사" },
  { value: "other", label: "기타" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ProfileRole>("labor_attorney");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim() || null,
          role,
          certificate_number: certificateNumber.trim() || null,
          office_location: officeLocation.trim() || null,
        },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/auth/pending");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-semibold text-foreground">회원가입</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        가입 후 관리자 승인이 완료되면 로그인할 수 있습니다.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2"
            required
          />
        </div>
        <div>
          <Label htmlFor="fullName">이름</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2"
            placeholder="실명"
          />
        </div>
        <div>
          <Label htmlFor="role">자격증 종류</Label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as ProfileRole)}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="certificateNumber">자격증 번호</Label>
          <Input
            id="certificateNumber"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            className="mt-2"
            placeholder="선택"
          />
        </div>
        <div>
          <Label htmlFor="officeLocation">사무실 위치</Label>
          <Input
            id="officeLocation"
            value={officeLocation}
            onChange={(e) => setOfficeLocation(e.target.value)}
            className="mt-2"
            placeholder="예: 서울시 강남구"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? "가입 중…" : "가입하기"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className="font-medium text-primary underline underline-offset-2">
          로그인
        </Link>
      </p>
    </div>
  );
}
