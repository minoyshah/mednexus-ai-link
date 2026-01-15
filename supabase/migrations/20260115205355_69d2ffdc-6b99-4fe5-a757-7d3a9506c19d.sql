-- Create role enum for users
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user role enum for medical roles
CREATE TYPE public.medical_role AS ENUM (
  'medical_student',
  'resident',
  'fellow',
  'attending',
  'researcher',
  'pharma_industry',
  'admin_institution'
);

-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- Create post category enum
CREATE TYPE public.post_category AS ENUM ('clinical', 'research', 'policy', 'education', 'industry');

-- Create post type enum  
CREATE TYPE public.post_type AS ENUM ('text', 'article', 'case_discussion', 'poll', 'announcement');

-- Create message status enum
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read');

-- Create connection status enum
CREATE TYPE public.connection_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  headline TEXT,
  avatar_url TEXT,
  about TEXT,
  medical_role public.medical_role,
  primary_specialty TEXT,
  subspecialty TEXT,
  clinical_interests TEXT[],
  research_interests TEXT[],
  institution TEXT,
  institution_email TEXT,
  institution_verified BOOLEAN DEFAULT false,
  geographic_licenses TEXT[],
  languages TEXT[],
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  open_to_opportunities BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create user_roles table for system roles (admin, moderator, etc)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create credentials table for verification
CREATE TABLE public.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credential_type TEXT NOT NULL,
  credential_number TEXT,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE,
  document_url TEXT,
  verification_status public.verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create education table
CREATE TABLE public.education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  institution_name TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create experience table
CREATE TABLE public.experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  location TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create publications table
CREATE TABLE public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  journal TEXT,
  publication_date DATE,
  doi TEXT,
  pubmed_id TEXT,
  url TEXT,
  authors TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create connections table
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status public.connection_status DEFAULT 'pending',
  connection_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(requester_id, recipient_id)
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_type public.post_type DEFAULT 'text',
  category public.post_category NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create post_reactions table
CREATE TABLE public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('agree', 'insightful', 'needs_evidence')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  status public.message_status DEFAULT 'sent',
  is_request BOOLEAN DEFAULT false,
  request_accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  read_at TIMESTAMPTZ
);

-- Create daily_message_count table for rate limiting
CREATE TABLE public.daily_message_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, message_date)
);

-- Create study_sessions table for AI study tracking
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create study_weaknesses table
CREATE TABLE public.study_weaknesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  subtopic TEXT,
  missed_count INTEGER DEFAULT 1,
  last_missed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, topic, subtopic)
);

-- Create specialties reference table
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.specialties(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert common medical specialties
INSERT INTO public.specialties (name) VALUES
  ('Anesthesiology'),
  ('Cardiology'),
  ('Dermatology'),
  ('Emergency Medicine'),
  ('Endocrinology'),
  ('Family Medicine'),
  ('Gastroenterology'),
  ('General Surgery'),
  ('Hematology'),
  ('Infectious Disease'),
  ('Internal Medicine'),
  ('Nephrology'),
  ('Neurology'),
  ('Neurosurgery'),
  ('Obstetrics & Gynecology'),
  ('Oncology'),
  ('Ophthalmology'),
  ('Orthopedic Surgery'),
  ('Otolaryngology'),
  ('Pathology'),
  ('Pediatrics'),
  ('Physical Medicine'),
  ('Plastic Surgery'),
  ('Psychiatry'),
  ('Pulmonology'),
  ('Radiology'),
  ('Rheumatology'),
  ('Urology'),
  ('Vascular Surgery');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_message_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_weaknesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
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

-- Create function to check if user is verified
CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.credentials
    WHERE user_id = _user_id
      AND verification_status = 'verified'
  )
$$;

-- Create function to get daily message limit
CREATE OR REPLACE FUNCTION public.get_daily_message_limit(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN (SELECT is_premium FROM public.profiles WHERE user_id = _user_id) = true THEN 30
    ELSE 5
  END
$$;

-- Create function to check if user can send message
CREATE OR REPLACE FUNCTION public.can_send_message(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  daily_limit INTEGER;
BEGIN
  SELECT COALESCE(count, 0) INTO current_count
  FROM public.daily_message_counts
  WHERE user_id = _user_id AND message_date = CURRENT_DATE;
  
  daily_limit := public.get_daily_message_limit(_user_id);
  
  RETURN COALESCE(current_count, 0) < daily_limit;
END;
$$;

-- Create function to increment message count
CREATE OR REPLACE FUNCTION public.increment_message_count(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.daily_message_counts (user_id, message_date, count)
  VALUES (_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, message_date)
  DO UPDATE SET count = daily_message_counts.count + 1;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON public.credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON public.connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies  
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Credentials policies
CREATE POLICY "Users can view own credentials" ON public.credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials" ON public.credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials" ON public.credentials
  FOR UPDATE USING (auth.uid() = user_id);

-- Education policies
CREATE POLICY "Users can view all education" ON public.education
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own education" ON public.education
  FOR ALL USING (auth.uid() = user_id);

-- Experience policies
CREATE POLICY "Users can view all experience" ON public.experience
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own experience" ON public.experience
  FOR ALL USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Users can view all certifications" ON public.certifications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own certifications" ON public.certifications
  FOR ALL USING (auth.uid() = user_id);

-- Publications policies
CREATE POLICY "Users can view all publications" ON public.publications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own publications" ON public.publications
  FOR ALL USING (auth.uid() = user_id);

-- Connections policies
CREATE POLICY "Users can view own connections" ON public.connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update own connections" ON public.connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);

-- Post reactions policies
CREATE POLICY "Anyone can view reactions" ON public.post_reactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can react" ON public.post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);

-- Bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Daily message counts policies
CREATE POLICY "Users can view own message counts" ON public.daily_message_counts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own message counts" ON public.daily_message_counts
  FOR ALL USING (auth.uid() = user_id);

-- Study sessions policies
CREATE POLICY "Users can view own study sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Study weaknesses policies
CREATE POLICY "Users can view own weaknesses" ON public.study_weaknesses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weaknesses" ON public.study_weaknesses
  FOR ALL USING (auth.uid() = user_id);

-- Specialties policies
CREATE POLICY "Anyone can view specialties" ON public.specialties
  FOR SELECT USING (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;