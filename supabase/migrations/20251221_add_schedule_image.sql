-- Add image_url column to schedule_items
ALTER TABLE public.schedule_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for schedule images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('schedule_images', 'schedule_images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Public can view images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'schedule_images' );

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'schedule_images' );

-- Policy: Authenticated users can update images
CREATE POLICY "Authenticated Update" 
ON storage.objects FOR UPDATE
TO authenticated 
USING ( bucket_id = 'schedule_images' );

-- Policy: Authenticated users can delete images
CREATE POLICY "Authenticated Delete" 
ON storage.objects FOR DELETE
TO authenticated 
USING ( bucket_id = 'schedule_images' );
