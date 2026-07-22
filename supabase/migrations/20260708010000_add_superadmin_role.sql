-- Phase 1a: add the missing 'superadmin' value to the app_role enum.
-- Must be in its own migration/transaction: Postgres cannot use a new enum
-- value in the same transaction that adds it.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
