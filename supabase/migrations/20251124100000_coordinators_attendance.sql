-- Create coordinators table
CREATE TABLE IF NOT EXISTS public.coordinators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    assigned_events UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    marked_by UUID REFERENCES public.coordinators(id),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    verification_method TEXT DEFAULT 'qr_scan' CHECK (verification_method IN ('qr_scan', 'manual', 'bulk')),
    notes TEXT,
    UNIQUE(registration_id, event_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_registration_id ON public.attendance(registration_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_at ON public.attendance(marked_at);
CREATE INDEX IF NOT EXISTS idx_coordinators_email ON public.coordinators(email);
CREATE INDEX IF NOT EXISTS idx_coordinators_active ON public.coordinators(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coordinators
CREATE POLICY "Admins can manage coordinators" ON public.coordinators
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Coordinators can view themselves" ON public.coordinators
    FOR SELECT
    USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- RLS Policies for attendance
CREATE POLICY "Admins can manage attendance" ON public.attendance
    FOR ALL
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Coordinators can mark attendance" ON public.attendance
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.coordinators 
            WHERE id = marked_by 
            AND is_active = true
            AND event_id = ANY(assigned_events)
        )
    );

CREATE POLICY "Coordinators can view attendance for their events" ON public.attendance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.coordinators 
            WHERE is_active = true
            AND attendance.event_id = ANY(assigned_events)
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coordinator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS coordinators_updated_at ON public.coordinators;
CREATE TRIGGER coordinators_updated_at
    BEFORE UPDATE ON public.coordinators
    FOR EACH ROW
    EXECUTE FUNCTION update_coordinator_updated_at();

-- Grant permissions
GRANT ALL ON public.coordinators TO authenticated;
GRANT ALL ON public.attendance TO authenticated;
GRANT SELECT ON public.coordinators TO anon;
GRANT SELECT ON public.attendance TO anon;
