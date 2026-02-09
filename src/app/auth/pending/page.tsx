"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PendingPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">승인 대기 중</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.
        승인 여부는 등록하신 이메일로 안내될 수 있습니다.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/">메인으로</Link>
        </Button>
      </div>
    </div>
  );
}
