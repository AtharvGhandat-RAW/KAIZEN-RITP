-- Add upi_qr_url column to events table for payment QR codes
ALTER TABLE events ADD COLUMN IF NOT EXISTS upi_qr_url text;

-- Add payment_proof_url column to registrations table for payment screenshots
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS payment_proof_url text;

COMMENT ON COLUMN events.upi_qr_url IS 'URL to the UPI QR code image for payment';
COMMENT ON COLUMN registrations.payment_proof_url IS 'URL to the payment proof screenshot uploaded by student';