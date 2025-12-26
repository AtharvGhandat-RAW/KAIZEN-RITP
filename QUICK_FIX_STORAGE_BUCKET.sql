-- ================================================
-- QUICK FIX: Create proof-uploads storage bucket
-- ================================================
-- Run this in Supabase SQL Editor immediately to fix "Bucket not found" error

-- Create storage bucket for proof uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-uploads', 'proof-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects for proof-uploads bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can upload to proof-uploads
CREATE POLICY "Anyone can upload proofs"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'proof-uploads');

-- Policy: Authenticated users can view their proofs
CREATE POLICY "Authenticated users can view proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proof-uploads');

-- Policy: Admins can update proofs (for notes/status)
CREATE POLICY "Admins can update proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'proof-uploads' 
    AND EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR email LIKE '%@admin%')
    )
  );

-- ================================================
-- Verification Query (run this after to confirm)
-- ================================================
-- SELECT id, name, public FROM storage.buckets WHERE id = 'proof-uploads';
