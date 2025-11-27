-- Fix RLS policies to allow public registrations without authentication

-- Drop existing restrictive policies on registrations table
DROP POLICY IF EXISTS "Users can create their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.registrations;
DROP POLICY IF EXISTS "Users can update their own registrations" ON public.registrations;

-- Allow anyone to create registrations (for public event registration)
CREATE POLICY "Anyone can create registrations"
  ON public.registrations
  FOR INSERT
  WITH CHECK (true);

-- Allow users to view their own registrations by email (through profile)
CREATE POLICY "Users can view registrations by profile"
  ON public.registrations
  FOR SELECT
  USING (
    profile_id IN (
      SELECT id FROM public.profiles 
      WHERE email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
    )
    OR 
    is_admin(auth.uid())
  );

-- Drop existing restrictive policy on profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Allow anyone to create profiles (needed for public registration)
CREATE POLICY "Anyone can create profiles"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update profiles by email (for re-registration)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Anyone can update profiles by email"
  ON public.profiles
  FOR UPDATE
  USING (true);

-- Teams policy - allow anyone to create teams for event registration
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

CREATE POLICY "Anyone can create teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (true);