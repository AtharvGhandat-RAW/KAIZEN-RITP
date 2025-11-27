-- Drop the foreign key constraint that's causing the issue
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Make user_id nullable since registration doesn't require authentication
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- Add a unique constraint on email to prevent duplicates
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_email_key;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Update RLS policies to work with email-based identification
DROP POLICY IF EXISTS "Users can view registrations by profile" ON public.registrations;

CREATE POLICY "Users can view registrations by email"
ON public.registrations
FOR SELECT
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE email = (
      SELECT email FROM public.profiles WHERE id = profile_id
    )
  )
  OR is_admin(auth.uid())
);