-- Execute this within your Supabase project's SQL Editor to add the required column
-- Project URL: https://ovaqnodmgzqkllvhkcxh.supabase.co
-- This adds the 'exclude_from_reports' attribute to allow hiding specific test/mistake passengers from analytics and reports.

ALTER TABLE public.passengers
ADD COLUMN IF NOT EXISTS exclude_from_reports BOOLEAN NOT NULL DEFAULT false;