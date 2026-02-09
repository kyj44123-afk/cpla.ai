# Pro-Connect DB 스키마

Next.js + Supabase 기반 문과 전문직 협업 중개 플랫폼(MVP) 테이블 설계입니다.

## 적용 방법

Supabase 대시보드 SQL Editor에서 다음 마이그레이션을 실행하거나,  
로컬 Supabase CLI 사용 시: `supabase db push`

- `supabase/migrations/20250131010000_pro_connect.sql`

(기존 협업 플랫폼 스키마가 있다면 해당 마이그레이션에서 `posts`를 새 스키마로 교체합니다.)

---

## 1. profiles (전문직 프로필)

`auth.users`와 1:1. **관리자 승인 후 로그인 가능** — `verification_status = true`일 때만 로그인 허용.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK, FK → auth.users) | 사용자 ID |
| email | text | 이메일 |
| full_name | text | 이름 |
| role | text | 전문직: lawyer, labor_attorney, tax_accountant, patent_attorney, other |
| certificate_number | text | 자격증 번호 |
| office_location | text | 사무실 위치(지역) |
| verification_status | boolean | 승인 여부 (기본값: false, 관리자 승인 시 true) |
| points | int (≥0) | 포인트 잔액 (공고 등록비·결제용) |
| created_at, updated_at | timestamptz | 생성/수정 일시 |

---

## 2. posts (협업 공고 / 의뢰)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 공고 ID |
| author_id | uuid (FK → profiles) | 작성자 ID |
| title | text | 제목 |
| content | text | 내용 |
| budget | text | 예산(보수) |
| deadline | date | 마감일 |
| status | text | open / closed |
| created_at, updated_at | timestamptz | 생성/수정 일시 |

---

## 3. applications (지원)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 지원 ID |
| post_id | uuid (FK → posts) | 공고 ID |
| applicant_id | uuid (FK → profiles) | 지원자 ID |
| status | text | pending / accepted / rejected |
| message | text | 지원 메시지 |
| created_at | timestamptz | 생성 일시 |
| UNIQUE(post_id, applicant_id) | | 공고당 1회만 지원 가능 |

---

## ER 요약

```
auth.users
    └── 1:1 ── public.profiles
              ├── 1:N ── public.posts (공고)
              │           └── 1:N ── public.applications (지원)
              └── 1:N ── public.applications (내가 지원한 공고)
```

---

## 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 클라이언트
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: 서버(API·트리거)
