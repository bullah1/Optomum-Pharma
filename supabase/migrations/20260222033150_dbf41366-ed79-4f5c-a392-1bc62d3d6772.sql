
-- Add b2b role to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'b2b';

-- Add b2b_price column to medicines
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS b2b_price numeric DEFAULT NULL;
