-- Create schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.schedules
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for admins" ON public.schedules
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert event_date setting if not exists
INSERT INTO public.settings (key, value)
VALUES ('event_date', '"March 15-16, 2025"')
ON CONFLICT (key) DO NOTHING;
