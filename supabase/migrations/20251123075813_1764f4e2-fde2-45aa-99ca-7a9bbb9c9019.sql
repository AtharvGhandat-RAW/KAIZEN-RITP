-- Create enum for admin roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'event_manager', 'finance', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS Policy: Only admins can view roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policy: Only super admins can manage roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Create queries table for contact form submissions
CREATE TABLE public.queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'seen', 'replied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit queries
CREATE POLICY "Anyone can submit queries"
ON public.queries
FOR INSERT
TO public
WITH CHECK (true);

-- Admins can view and manage queries
CREATE POLICY "Admins can view queries"
ON public.queries
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update queries"
ON public.queries
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete queries"
ON public.queries
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('title', 'gold', 'silver', 'associate')),
  website_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible sponsors
CREATE POLICY "Anyone can view visible sponsors"
ON public.sponsors
FOR SELECT
TO public
USING (is_visible = true);

-- Admins can manage sponsors
CREATE POLICY "Admins can manage sponsors"
ON public.sponsors
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create settings table for dynamic configuration
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings"
ON public.settings
FOR SELECT
TO public
USING (true);

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.settings (key, value, category, description) VALUES
('intro_enabled', 'true', 'website', 'Enable/disable intro animation'),
('intro_coordinator', '"Fest Coordinator Name"', 'website', 'Fest coordinator name for intro'),
('intro_unit', '"Technical Unit"', 'website', 'Unit name for intro'),
('intro_year', '"2025"', 'website', 'Year for intro'),
('intro_theme', '"Fear the Unknown"', 'website', 'Theme tagline'),
('hero_title', '"KAIZEN"', 'homepage', 'Hero section title'),
('hero_subtitle', '"The Official Tech Fest of RIT — Stranger Things Edition"', 'homepage', 'Hero section subtitle'),
('hero_cta_primary', '"Explore Events"', 'homepage', 'Primary CTA button text'),
('hero_cta_secondary', '"Enter the Upside Down"', 'homepage', 'Secondary CTA button text'),
('countdown_target', '"2025-03-15T09:00:00"', 'homepage', 'Event countdown target date'),
('registration_enabled', 'true', 'registration', 'Enable/disable registration'),
('registration_notice', '""', 'registration', 'Notice banner for registration'),
('contact_email', '"info@kaizen.rit.edu"', 'contact', 'Support email'),
('contact_phone', '"+91 1234567890"', 'contact', 'Support phone number'),
('sponsors_visible', 'true', 'sponsors', 'Show/hide sponsors section'),
('theme_glow_intensity', '0.8', 'theme', 'Global glow intensity (0-1)'),
('theme_neon_enabled', 'true', 'theme', 'Enable neon effects'),
('theme_animation_enabled', 'true', 'theme', 'Enable background animations');

-- Update trigger for queries
CREATE TRIGGER update_queries_updated_at
BEFORE UPDATE ON public.queries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Update trigger for sponsors
CREATE TRIGGER update_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Update trigger for settings
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Update RLS for events to allow admins to manage
CREATE POLICY "Admins can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
ON public.events
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Update RLS for registrations to allow admins to view all
CREATE POLICY "Admins can view all registrations"
ON public.registrations
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all registrations"
ON public.registrations
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));