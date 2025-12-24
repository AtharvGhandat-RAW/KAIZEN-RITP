-- Add columns for fest registration if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS fest_payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS fest_payment_id TEXT,
ADD COLUMN IF NOT EXISTS fest_payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS is_fest_registered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fest_registration_code TEXT;
