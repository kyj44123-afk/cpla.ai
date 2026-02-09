-- 1. Chat Sessions (Independent)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Requests Table (Depends on chat_sessions)
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  type text not null, -- 'contact_submission', etc.
  data jsonb default '{}'::jsonb,
  session_id uuid references public.chat_sessions(id) on delete set null
);

-- 3. Chat Messages (Depends on chat_sessions)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- 4. Analytics Events (Depends on chat_sessions)
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete set null,
  event_type text not null, -- 'click', 'view', 'contact_submit'
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists requests_session_id_idx on public.requests (session_id);
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);
create index if not exists analytics_events_session_id_idx on public.analytics_events (session_id);
