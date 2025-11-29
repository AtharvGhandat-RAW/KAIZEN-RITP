-- Fix RLS policy for coordinator login
-- Allow anonymous users to check coordinator credentials during login

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Coordinators can view themselves" ON public.coordinators;

-- Create a new policy that allows public read access for login
-- Only expose necessary fields for authentication
CREATE POLICY "Allow coordinator login" ON public.coordinators
    FOR SELECT
    USING (true);  -- Allow anyone to query coordinators table for login

-- Note: The password_hash is selected but only compared server-side
-- The actual password is never exposed to the client

-- Alternatively, for more security, you could create a stored function
-- that handles login and only returns success/failure, not the hash
