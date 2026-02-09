"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";

const ROLE_LABEL: Record<string, string> = {
  lawyer: "변호사",
  labor_attorney: "노무사",
  tax_accountant: "세무사",
  patent_attorney: "변리사",
  other: "기타",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        if (!user) {
          router.replace("/auth/login");
          return;
        }
        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (cancelled) return;
        if (error || !data) {
          router.replace("/auth/login");
          return;
        }
        if (!data.verification_status) {
          router.replace("/auth/login?message=pending");
          return;
        }
        setProfile(data as Profile);
      } catch {
        if (!cancelled) router.replace("/auth/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="font-semibold text-foreground">
            Pro-Connect
          </Link>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/post">공고 등록</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">메인</Link>
            </Button>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:flex lg:gap-8">
        <main className="min-w-0 flex-1">{children}</main>
        <aside className="mt-8 shrink-0 lg:mt-0 lg:w-72">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">내 프로필</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {profile.full_name ?? "—"} · {ROLE_LABEL[profile.role] ?? profile.role}
            </p>
            {profile.office_location && (
              <p className="mt-0.5 text-xs text-muted-foreground">{profile.office_location}</p>
            )}
            <p className="mt-3 text-sm font-medium text-foreground">
              포인트 잔액: <span className="text-primary">{profile.points} P</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
