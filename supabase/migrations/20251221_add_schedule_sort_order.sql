-- Add sort_order column to schedule_items
ALTER TABLE public.schedule_items ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing items to have a default sort order (optional, but good practice)
UPDATE public.schedule_items SET sort_order = 0 WHERE sort_order IS NULL;
