-- ==============================================================================
-- Security Policies Migration
-- Enable Row-Level Security and create auto-deletion function
-- ==============================================================================

-- 1. Enable RLS on all tables
-- Service role key (used in API routes) bypasses RLS
-- Anonymous/authenticated users cannot directly access tables

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- 2. Create policies that block all direct access
-- Only service_role (API server) can access data

-- Chat Sessions: No direct access
CREATE POLICY "No direct access to chat_sessions" ON public.chat_sessions
  FOR ALL USING (false);

-- Chat Messages: No direct access  
CREATE POLICY "No direct access to chat_messages" ON public.chat_messages
  FOR ALL USING (false);

-- Analytics Events: No direct access
CREATE POLICY "No direct access to analytics_events" ON public.analytics_events
  FOR ALL USING (false);

-- Requests: No direct access (contains personal info)
CREATE POLICY "No direct access to requests" ON public.requests
  FOR ALL USING (false);

-- ==============================================================================
-- 3. Auto-deletion function for personal data (10 days)
-- ==============================================================================

CREATE OR REPLACE FUNCTION delete_old_personal_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete contact requests older than 10 days
  DELETE FROM public.requests 
  WHERE created_at < NOW() - INTERVAL '10 days';
  
  -- Delete chat sessions (will cascade to messages) older than 10 days
  DELETE FROM public.chat_sessions 
  WHERE created_at < NOW() - INTERVAL '10 days';
  
  -- Delete analytics events older than 10 days
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - INTERVAL '10 days';
  
  RAISE NOTICE 'Old personal data deleted successfully';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_old_personal_data() TO service_role;

-- ==============================================================================
-- 4. Schedule daily execution (if pg_cron is enabled)
-- Run this manually in Supabase SQL Editor if pg_cron is available:
-- 
-- SELECT cron.schedule(
--   'daily-cleanup',
--   '0 3 * * *',  -- Every day at 3 AM UTC
--   'SELECT delete_old_personal_data()'
-- );
-- ==============================================================================
