-- =====================================================
-- FIX: Add 7-parameter wrapper for register_fest_user
-- Purpose: Match client calls expecting 7 args (no proof URL)
-- Date: 2025-12-26
-- Safe, idempotent: CREATE OR REPLACE
-- =====================================================

CREATE OR REPLACE FUNCTION public.register_fest_user(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_education TEXT,
  p_college TEXT,
  p_year TEXT,
  p_branch TEXT
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delegate to the 8-arg variant, passing NULL for payment proof URL
  RETURN public.register_fest_user(
    p_full_name,
    p_email,
    p_phone,
    p_education,
    p_college,
    p_year,
    p_branch,
    NULL
  );
END;
$$;