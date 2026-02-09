# Pro-Connect 프로젝트 구조

문과 전문직 협업 중개 플랫폼 MVP — Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/UI, Supabase, PortOne(UI만 예정).

## 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI, Lucide React Icons
- **Backend/DB**: Supabase (Auth, Postgres, Storage)
- **State**: Zustand (필요 시)
- **Payment**: PortOne 연동 예정 (UI만 먼저 구현)

## 디자인

- 네이비/화이트 톤 (Clean & Corporate, 신뢰감)
- 가독성 좋은 Sans-serif
- 모바일 반응형 필수

## 디렉터리 구조

```
src/
├── app/
│   ├── page.tsx                 # 랜딩: 배너 슬롯 + 최신 의뢰 미리보기
│   ├── layout.tsx
│   ├── auth/
│   │   ├── login/page.tsx       # 로그인 (승인된 회원만)
│   │   ├── register/page.tsx    # 가입 (이름, 자격증 종류·번호, 사무실 위치)
│   │   └── pending/page.tsx     # 승인 대기 안내
│   ├── dashboard/
│   │   ├── layout.tsx          # 로그인·승인 체크, 사이드바(프로필·포인트)
│   │   └── page.tsx             # 협업 공고 리스트 (필터: 지역, 전문직, 보수)
│   ├── post/
│   │   └── page.tsx             # 공고 등록 (제목, 내용, 예산, 마감일) → 결제 모달
│   ├── project/
│   │   └── [id]/page.tsx        # 공고 상세 + 지원하기
│   ├── api/
│   │   └── posts/route.ts       # GET 목록, POST 등록
│   ├── posts/                   # 구 라우트 리다이렉트 (new → /post, [id] → /project/[id])
│   ├── admin/, chat/            # 기존 기능 유지
│   └── globals.css
├── components/
│   ├── landing/
│   │   ├── BannerSlot.tsx       # 배너 광고 슬롯
│   │   └── LatestPostsPreview.tsx # 최신 의뢰 미리보기
│   ├── post/
│   │   └── PaymentModal.tsx    # 공고 등록비 결제 모달 (PortOne UI 예정)
│   └── ui/                      # Shadcn/UI
├── lib/
│   ├── supabase.ts              # 브라우저용 Supabase 클라이언트
│   ├── supabaseAdmin.ts         # 서버용(service role)
│   └── utils.ts
├── types/
│   └── database.ts              # Profile, Post, Application
└── middleware.ts

supabase/
├── schema.sql                   # 기존(문서·벡터 등)
└── migrations/
    ├── 20250131000000_collaboration_platform.sql  # (이전 스키마)
    └── 20250131010000_pro_connect.sql             # profiles, posts, applications
```

## 주요 플로우

1. **가입** (`/auth/register`): 이메일/비밀번호 + 이름, 자격증 종류·번호, 사무실 위치 → `auth.users` 생성 → 트리거로 `profiles` 행 생성 (`verification_status: false`).
2. **승인**: 관리자가 Supabase에서 `profiles.verification_status = true`로 변경 → 이후 로그인 가능.
3. **로그인** (`/auth/login`): Supabase 로그인 후 `profiles.verification_status` 확인, false면 로그아웃 후 "승인 대기 중" 안내.
4. **대시보드** (`/dashboard`): 로그인·승인된 유저만 접근, 공고 리스트 + 필터(지역, 전문직, 보수), 우측 사이드바에 프로필·포인트.
5. **공고 등록** (`/post`): 제목, 내용, 예산, 마감일 → 등록 시 결제 모달(포인트 차감 또는 PortOne UI 예정) → API로 등록.
6. **공고 상세** (`/project/[id]`): 상세 보기 + 지원하기 → `applications` insert (작성자 알림/이메일 트리거 추후).

## 수익 모델

- 공고 등록비(건당 결제)
- 배너 광고(배너 슬롯 UI 구현됨)

DB 스키마 상세: `docs/SCHEMA.md`
