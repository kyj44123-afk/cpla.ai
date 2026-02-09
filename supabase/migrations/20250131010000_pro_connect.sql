-- ============================================================
-- Pro-Connect (문과 전문직 협업 중개) MVP 스키마
-- profiles, posts, applications
-- ============================================================
-- 기존 posts가 있으면 제거 후 새 스키마로 생성 (profiles는 신규)
drop table if exists public.applications;
drop table if exists public.posts;

-- 1) 프로필 (관리자 승인 후 로그인 가능, verification_status = true)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('lawyer', 'labor_attorney', 'tax_accountant', 'patent_attorney', 'other')),
  certificate_number text,
  office_location text,
  verification_status boolean not null default false,
  points int not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_verification_status_idx on public.profiles (verification_status);
create index if not exists profiles_office_location_idx on public.profiles (office_location);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Service role can manage profiles"
  on public.profiles for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- 2) 협업 공고 (의뢰)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text,
  budget text,
  deadline date,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_deadline_idx on public.posts (deadline);

alter table public.posts enable row level security;

create policy "Anyone can read open posts"
  on public.posts for select
  using (status = 'open' or author_id = auth.uid());

create policy "Authors can insert own posts"
  on public.posts for insert
  with check (author_id = auth.uid());

create policy "Authors can update own posts"
  on public.posts for update
  using (author_id = auth.uid());

create policy "Service role can manage posts"
  on public.posts for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- 3) 지원 (applications)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  message text,
  created_at timestamptz not null default now(),
  unique(post_id, applicant_id)
);

create index if not exists applications_post_id_idx on public.applications (post_id);
create index if not exists applications_applicant_id_idx on public.applications (applicant_id);

alter table public.applications enable row level security;

create policy "Post authors can read applications for their posts"
  on public.applications for select
  using (
    exists (
      select 1 from public.posts p
      where p.id = applications.post_id and p.author_id = auth.uid()
    )
  );

create policy "Applicants can read own applications"
  on public.applications for select
  using (applicant_id = auth.uid());

create policy "Applicants can insert own application"
  on public.applications for insert
  with check (applicant_id = auth.uid());

create policy "Service role can manage applications"
  on public.applications for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- 4) 가입 시 프로필 생성 (승인 대기 상태)
create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, certificate_number, office_location, verification_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'email', new.email),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'other'),
    new.raw_user_meta_data ->> 'certificate_number',
    new.raw_user_meta_data ->> 'office_location',
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_profile();

-- 5) updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();
