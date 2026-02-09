-- Chat Sessions
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Analytics Events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete set null,
  event_type text not null, -- 'click', 'view', 'contact_submit'
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add Link to Requests (Contact Info)
-- We use 'do' block to check if column exists safely if we can't use 'if not exists' directly in alter table in older postgres versions, 
-- but Supabase usually supports 'add column if not exists'. 
-- Safe approach:
alter table public.requests add column if not exists session_id uuid references public.chat_sessions(id) on delete set null;

-- Indexes
create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);
create index if not exists analytics_events_session_id_idx on public.analytics_events (session_id);
create index if not exists requests_session_id_idx on public.requests (session_id);
