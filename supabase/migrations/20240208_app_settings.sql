-- App Settings table for storing API keys and other configurations
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.app_settings enable row level security;

-- Only allow service role to access settings (no public access)
-- Settings will be accessed via API routes with service role key
