-- Ensure storage bucket policies allow public uploads for payment proofs

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can upload payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Allow anyone to upload to event-payments bucket
CREATE POLICY "Anyone can upload payment proofs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'event-payments');

-- Allow anyone to view files in event-payments bucket (it's already public)
CREATE POLICY "Anyone can view payment proofs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'event-payments');