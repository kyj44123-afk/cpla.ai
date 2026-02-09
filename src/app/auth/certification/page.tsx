"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CertificationPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-[family-name:var(--font-serif)] text-2xl font-semibold">
        자격 인증
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        가입이 완료되었습니다. 자격증 인증을 진행해 주세요. 인증이 완료되면 협업 요청 글 작성 및 포인트 결제가 가능합니다.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        (관리자 승인 후 인증 상태가 &apos;인증 완료&apos;로 변경됩니다. 실제 인증 업로드·승인 플로우는 추후 구현 예정입니다.)
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild className="bg-[color:var(--brand)] hover:bg-[color:var(--brand)]/90">
          <Link href="/">메인으로</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auth/login">로그인</Link>
        </Button>
      </div>
    </div>
  );
}
