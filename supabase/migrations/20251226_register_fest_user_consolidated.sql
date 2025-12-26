-- =====================================================
-- Consolidated migration: storage + policies + trigger + RPC + wrapper
-- Date: 2025-12-26
-- Safe to re-run; uses CREATE OR REPLACE and ON CONFLICT
-- =====================================================

-- 0) Schema updates (Fix missing columns and tables)
DO $$ BEGIN
  -- Add proof_status to registrations if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'proof_status') THEN
    ALTER TABLE public.registrations ADD COLUMN proof_status TEXT DEFAULT 'pending';
  END IF;

  -- Add payment_proof_url to registrations if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'registrations' AND column_name = 'payment_proof_url') THEN
    ALTER TABLE public.registrations ADD COLUMN payment_proof_url TEXT;
  END IF;
END $$;

-- Create proof_uploads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.proof_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT,
    file_type TEXT,
    proof_status TEXT DEFAULT 'pending',
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on proof_uploads
ALTER TABLE public.proof_uploads ENABLE ROW LEVEL SECURITY;

-- Policies for proof_uploads (Ensure admins can see them)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proof_uploads' AND policyname = 'Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" ON public.proof_uploads FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proof_uploads' AND policyname = 'Enable insert for all users') THEN
    CREATE POLICY "Enable insert for all users" ON public.proof_uploads FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 1) Helper trigger function (used by proof_uploads trigger)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

-- 2) Storage bucket for proofs (private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-uploads', 'proof-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 3) Basic storage policies
DO $$ BEGIN
  -- Insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can upload proofs'
  ) THEN
    CREATE POLICY "Anyone can upload proofs"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'proof-uploads');
  END IF;
  -- Select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can view proofs'
  ) THEN
    CREATE POLICY "Users can view proofs"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'proof-uploads');
  END IF;
END $$;

-- 4) RPC function to register fest user (8 args, proof optional)
CREATE OR REPLACE FUNCTION public.register_fest_user(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_education TEXT,
  p_college TEXT,
  p_year TEXT,
  p_branch TEXT,
  p_payment_proof_url TEXT DEFAULT NULL
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile_id UUID;
  v_registration_id UUID;
  v_fest_event_id UUID;
  v_response json;
BEGIN
  -- Get fest event ID (fallback to fixed UUID if none)
  SELECT id INTO v_fest_event_id FROM public.events WHERE event_type = 'fest' LIMIT 1;
  IF v_fest_event_id IS NULL THEN
    v_fest_event_id := '12345678-1234-1234-1234-123456789012'::UUID;
  END IF;

  -- Upsert profile by email
  INSERT INTO public.profiles (full_name, email, phone, education, college, year, branch)
  VALUES (p_full_name, p_email, p_phone, p_education, p_college, p_year, p_branch)
  ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    college = COALESCE(EXCLUDED.college, public.profiles.college),
    year = COALESCE(EXCLUDED.year, public.profiles.year),
    branch = COALESCE(EXCLUDED.branch, public.profiles.branch),
    updated_at = now()
  RETURNING id INTO v_profile_id;

  -- Upsert registration
  INSERT INTO public.registrations (profile_id, event_id, registration_type, payment_status, payment_proof_url, proof_status)
  VALUES (v_profile_id, v_fest_event_id, 'solo', CASE WHEN p_payment_proof_url IS NOT NULL THEN 'completed' ELSE 'pending' END, p_payment_proof_url, 'pending')
  ON CONFLICT (profile_id, event_id) DO UPDATE SET
    payment_proof_url = COALESCE(EXCLUDED.payment_proof_url, public.registrations.payment_proof_url),
    proof_status = 'pending',
    updated_at = now()
  RETURNING id INTO v_registration_id;

  -- Optional: record proof upload meta if URL provided
  IF p_payment_proof_url IS NOT NULL THEN
    INSERT INTO public.proof_uploads (registration_id, file_path, file_name, file_type, proof_status)
    VALUES (v_registration_id, p_payment_proof_url, 'payment_proof_' || v_registration_id || '.file', 'application/octet-stream', 'pending')
    ON CONFLICT DO NOTHING;
  END IF;

  v_response := json_build_object(
    'success', true,
    'message', 'Registration submitted successfully',
    'registration_id', v_registration_id,
    'profile_id', v_profile_id,
    'fest_event_id', v_fest_event_id
  );
  RETURN v_response;
EXCEPTION WHEN OTHERS THEN
  v_response := json_build_object('success', false, 'message', SQLERRM, 'error_code', SQLSTATE);
  RETURN v_response;
END; $$;

-- 5) 7-arg wrapper (delegates with NULL for proof URL)
CREATE OR REPLACE FUNCTION public.register_fest_user(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_education TEXT,
  p_college TEXT,
  p_year TEXT,
  p_branch TEXT
)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.register_fest_user(p_full_name, p_email, p_phone, p_education, p_college, p_year, p_branch, NULL);
END; $$;

-- 6) Reload PostgREST schema so RPC appears immediately
DO $$ BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
