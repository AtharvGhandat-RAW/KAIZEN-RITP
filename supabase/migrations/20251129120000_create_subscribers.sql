-- Create subscribers table
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public to subscribe (insert only)
CREATE POLICY "Public can subscribe"
  ON public.subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow admins to view subscribers
CREATE POLICY "Admins can view subscribers"
  ON public.subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'event_manager')
    )
  );
