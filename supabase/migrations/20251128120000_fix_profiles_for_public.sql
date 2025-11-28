-- Make user_id nullable in profiles to allow public registrations
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Allow public to insert into profiles
CREATE POLICY "Enable insert for public users" ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- Allow public to update profiles that don't have a linked user account
CREATE POLICY "Enable update for public profiles" ON public.profiles
    FOR UPDATE
    USING (user_id IS NULL);

-- Allow public uploads to event-payments bucket
CREATE POLICY "Allow public uploads to event-payments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-payments');
