-- Create storage bucket for payment proofs and UPI QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-payments', 'event-payments', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Anyone can view payment files"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-payments');

CREATE POLICY "Authenticated users can upload payment files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-payments');

CREATE POLICY "Admins can manage payment files"
ON storage.objects FOR ALL
USING (bucket_id = 'event-payments' AND is_admin(auth.uid()));