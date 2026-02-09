-- ============================================================
-- 전문직 협업 중개 플랫폼: Users, Posts, Payments
-- ============================================================
-- Supabase Auth(auth.users)와 연동하는 프로필/포인트/게시글 스키마
-- ============================================================

-- 1) 전문직 사용자 프로필 (auth.users 확장)
-- 자격증 인증 후 가입 완료, 포인트 잔액 보유
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  profession_type text not null check (profession_type in ('lawyer', 'labor_attorney', 'tax_accountant', 'patent_attorney', 'other')),
  certification_status text not null default 'pending' check (certification_status in ('pending', 'verified', 'rejected')),
  certification_submitted_at timestamptz,
  certification_verified_at timestamptz,
  points_balance int not null default 0 check (points_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_profession_type_idx on public.users (profession_type);
create index if not exists users_certification_status_idx on public.users (certification_status);
create index if not exists users_created_at_idx on public.users (created_at desc);

-- RLS: 본인만 읽기/수정 (인증된 사용자만 게시글 작성 등은 앱/트리거에서 제어)
alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- 서버/관리자용: insert는 signup 후 트리거 또는 API에서 처리
create policy "Service role can manage users"
  on public.users for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- 2) 협업 요청 게시판 (글 작성 시 포인트 차감)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text,
  point_cost int not null check (point_cost > 0),
  status text not null default 'published' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

create policy "Anyone can read published posts"
  on public.posts for select
  using (status = 'published' or author_id = auth.uid());

create policy "Authors can insert own posts"
  on public.posts for insert
  with check (author_id = auth.uid());

create policy "Authors can update own posts"
  on public.posts for update
  using (author_id = auth.uid());

create policy "Service role can manage posts"
  on public.posts for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- 3) 포인트 결제/사용 내역 (충전, 게시글 작성 차감, 환불 등)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('purchase', 'post_charge', 'refund', 'admin_adjust')),
  amount int not null,  -- 양수: 충전/환불, 음수: 게시글 작성 등 차감
  balance_after int,    -- 거래 후 잔액 (선택, 감사용)
  reference_type text,  -- 'post', 'point_package', null
  reference_id uuid,
  metadata jsonb,       -- 결제 PG 정보, 포인트 패키지 ID 등
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
create index if not exists payments_type_idx on public.payments (type);

alter table public.payments enable row level security;

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Service role can manage payments"
  on public.payments for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- 4) 가입 시 users 행 생성 (Auth 트리거)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, profession_type, certification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'email', new.email),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'profession_type', 'other'),
    'pending'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_updated_at on public.users;
create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
