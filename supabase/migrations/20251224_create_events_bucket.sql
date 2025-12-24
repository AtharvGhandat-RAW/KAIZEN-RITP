-- Create events bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('events', 'events', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for events bucket
-- Allow public access to view files
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'events');

-- Allow admins to upload files
CREATE POLICY "Admin Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'events' AND public.is_admin(auth.uid()));

-- Allow admins to update files
CREATE POLICY "Admin Update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'events' AND public.is_admin(auth.uid()));

-- Allow admins to delete files
CREATE POLICY "Admin Delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'events' AND public.is_admin(auth.uid()));
