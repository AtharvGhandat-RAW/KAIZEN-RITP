-- ================================================
-- KAIZEN 2025 - Complete Database Setup
-- Run this in Supabase SQL Editor
-- ================================================

-- ============ MIGRATION 1: Core Tables ============

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  year TEXT,
  branch TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  event_type TEXT NOT NULL,
  max_team_size INTEGER,
  min_team_size INTEGER,
  registration_fee DECIMAL(10,2) DEFAULT 0,
  prize_pool DECIMAL(10,2),
  venue TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  image_url TEXT,
  rules TEXT[],
  coordinators TEXT[],
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  upi_qr_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disqualified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(name, event_id)
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(team_id, profile_id)
);

-- Create registrations table
CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  registration_type TEXT NOT NULL CHECK (registration_type IN ('solo', 'team')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_id TEXT,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(profile_id, event_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- ============ MIGRATION 2: Admin Roles ============

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

-- ============ MIGRATION 3: Queries Table ============

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

-- ============ MIGRATION 4: Sponsors Table ============

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

-- ============ MIGRATION 5: Settings Table ============

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

-- ============ FUNCTIONS ============

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_queries_updated_at
  BEFORE UPDATE ON public.queries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============ RLS POLICIES ============

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON public.profiles FOR UPDATE
  USING (true);

-- Events policies
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

CREATE POLICY "Admins can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Teams policies
CREATE POLICY "Anyone can view teams"
  ON public.teams FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Team leaders can update their teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE id = leader_id
  ));

-- Team members policies
CREATE POLICY "Anyone can view team members"
  ON public.team_members FOR SELECT
  USING (true);

CREATE POLICY "Team leaders can manage team members"
  ON public.team_members FOR ALL
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.teams t ON t.leader_id = p.id
    WHERE t.id = team_id
  ));

-- Registrations policies
CREATE POLICY "Anyone can create registrations"
  ON public.registrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view registrations"
  ON public.registrations FOR SELECT
  USING (true);

CREATE POLICY "Admins can update all registrations"
  ON public.registrations FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Queries policies
CREATE POLICY "Anyone can submit queries"
  ON public.queries FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Admins can view queries"
  ON public.queries FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update queries"
  ON public.queries FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete queries"
  ON public.queries FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Sponsors policies
CREATE POLICY "Anyone can view visible sponsors"
  ON public.sponsors FOR SELECT
  TO public
  USING (is_visible = true);

CREATE POLICY "Admins can manage sponsors"
  ON public.sponsors FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Settings policies
CREATE POLICY "Anyone can read settings"
  ON public.settings FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ============ STORAGE BUCKET ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-payments', 'event-payments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view payment files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-payments');

CREATE POLICY "Anyone can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-payments');

-- ============ DEFAULT SETTINGS ============

INSERT INTO public.settings (key, value, category, description) VALUES
('contact_email', '"info@kaizen.rit.edu"', 'contact', 'Support email'),
('contact_phone', '"+91 1234567890"', 'contact', 'Support phone number'),
('whatsapp_number', '"+919876543210"', 'contact', 'WhatsApp support number'),
('registration_enabled', 'true', 'registration', 'Enable/disable registration'),
('registration_notice', '""', 'registration', 'Notice banner for registration'),
('countdown_target', '"2025-03-15T09:00:00"', 'homepage', 'Event countdown target date'),
('upi_id', '"kaizen@upi"', 'payment', 'Default UPI ID for payments'),
('instagram_url', '"https://instagram.com/kaizen_rit"', 'social', 'Instagram page URL'),
('facebook_url', '"https://facebook.com/kaizenrit"', 'social', 'Facebook page URL'),
('twitter_url', '"https://twitter.com/kaizen_rit"', 'social', 'Twitter/X page URL'),
('youtube_url', '"https://youtube.com/@kaizenrit"', 'social', 'YouTube channel URL'),
('linkedin_url', '"https://linkedin.com/company/kaizen-rit"', 'social', 'LinkedIn page URL');

-- ============ ADD UNIQUE EMAIL CONSTRAINT ============

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Make user_id nullable for public registrations
ALTER TABLE public.profiles 
ALTER COLUMN user_id DROP NOT NULL;

-- ================================================
-- SETUP COMPLETE!
-- ================================================
