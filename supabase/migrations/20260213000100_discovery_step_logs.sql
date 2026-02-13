create table if not exists public.discovery_step_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  step smallint not null check (step between 1 and 5),
  event_type text not null,
  audience text null check (audience in ('worker', 'employer')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists discovery_step_logs_session_id_idx
  on public.discovery_step_logs (session_id);

create index if not exists discovery_step_logs_created_at_idx
  on public.discovery_step_logs (created_at desc);

create index if not exists discovery_step_logs_step_idx
  on public.discovery_step_logs (step);
