-- Create schedule_items table for detailed event timeline
CREATE TABLE IF NOT EXISTS public.schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  day_number INTEGER DEFAULT 1,
  item_type TEXT DEFAULT 'event' CHECK (item_type IN ('ceremony', 'event', 'break', 'activity', 'workshop', 'competition', 'other')),
  venue TEXT,
  speakers TEXT[], -- Array of speaker names
  is_highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view schedule items"
  ON public.schedule_items
  FOR SELECT
  TO public
  USING (true);

-- Admin full access (authenticated users)
CREATE POLICY "Authenticated users can manage schedule items"
  ON public.schedule_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_schedule_items_day ON public.schedule_items(day_number, start_time);
CREATE INDEX idx_schedule_items_type ON public.schedule_items(item_type);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_schedule_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_items_updated_at
  BEFORE UPDATE ON public.schedule_items
  FOR EACH ROW
  EXECUTE FUNCTION update_schedule_items_updated_at();
