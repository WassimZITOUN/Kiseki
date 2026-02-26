-- ============================================================
-- Kiseki – Notification Configuration Table
-- Migration 012 : Store service role key in a table
-- (Alternative to ALTER SYSTEM which can't run in transactions)
-- ============================================================

-- Create config table for notification system
CREATE TABLE IF NOT EXISTS public.notification_config (
  id INT PRIMARY KEY DEFAULT 1,
  service_role_key TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (id = 1)  -- Ensure only one row
);

-- Insert the service role key (replace with actual key when needed)
INSERT INTO public.notification_config (service_role_key)
VALUES ('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2amFya3NiZ3RsdGZtYXFxd3ZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk5MjQ2NSwiZXhwIjoyMDg1NTY4NDY1fQ.dplKnRlNeBwlbeh-8ZH0jcP0Vr5BPHm4ZlK0VcG-BMg')
ON CONFLICT (id) DO UPDATE
SET service_role_key = EXCLUDED.service_role_key;

-- Enable RLS (only authenticated users can read)
ALTER TABLE public.notification_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_key_read"
  ON public.notification_config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Helper function to get the service role key
CREATE OR REPLACE FUNCTION public.get_notification_service_key()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT service_role_key FROM public.notification_config WHERE id = 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the cron jobs to use the table instead of GUC

-- 2a. Morning notification — 09:05 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('kiseki-notify-morning');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'kiseki-notify-morning',
  '5 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || public.get_notification_service_key()
    ),
    body    := '{"type":"daily_question"}'::jsonb
  );
  $$
);

-- 2b. Reminder notification — 19:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('kiseki-notify-reminder');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'kiseki-notify-reminder',
  '0 19 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || public.get_notification_service_key()
    ),
    body    := '{"type":"vote_reminder"}'::jsonb
  );
  $$
);

-- 2c. Reveal notification — 20:00 UTC
DO $$
BEGIN
  PERFORM cron.unschedule('kiseki-notify-reveal');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
  'kiseki-notify-reveal',
  '0 20 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://avjarksbgtltfmaqqwvd.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || public.get_notification_service_key()
    ),
    body    := '{"type":"results_reveal"}'::jsonb
  );
  $$
);
