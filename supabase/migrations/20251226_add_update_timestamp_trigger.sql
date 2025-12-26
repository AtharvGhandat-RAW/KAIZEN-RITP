-- =====================================================
-- Support: Define update_updated_at() trigger helper + reload schema
-- Date: 2025-12-26
-- Safe, idempotent: CREATE OR REPLACE
-- =====================================================

-- Helper trigger function to bump updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Ask PostgREST to reload schema so new functions are visible
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if channel not available
  NULL;
END $$;