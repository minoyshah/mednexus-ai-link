-- Fix 1: Protect premium/verification fields from user modification via trigger
CREATE OR REPLACE FUNCTION public.protect_premium_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if protected fields are being modified
  IF (OLD.is_premium IS DISTINCT FROM NEW.is_premium 
      OR OLD.premium_expires_at IS DISTINCT FROM NEW.premium_expires_at 
      OR OLD.institution_verified IS DISTINCT FROM NEW.institution_verified) THEN
    
    -- Only admins can modify these fields
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      -- Revert the protected fields to their original values
      NEW.is_premium := OLD.is_premium;
      NEW.premium_expires_at := OLD.premium_expires_at;
      NEW.institution_verified := OLD.institution_verified;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER protect_premium_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();

-- Fix 2: Enforce message rate limiting via RLS
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages within limit" ON public.messages
  FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id 
    AND public.can_send_message(auth.uid())
  );

-- Fix 3: Create trigger to increment message count after insert
CREATE OR REPLACE FUNCTION public.increment_message_count_trigger()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.increment_message_count(NEW.sender_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER message_count_increment_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_message_count_trigger();

-- Fix 4: Add input validation constraints for content length
ALTER TABLE public.posts ADD CONSTRAINT posts_content_length CHECK (length(content) <= 10000);
ALTER TABLE public.comments ADD CONSTRAINT comments_content_length CHECK (length(content) <= 2000);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_headline_length CHECK (headline IS NULL OR length(headline) <= 200);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_about_length CHECK (about IS NULL OR length(about) <= 5000);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_fullname_length CHECK (full_name IS NULL OR length(full_name) <= 100);
ALTER TABLE public.messages ADD CONSTRAINT messages_content_length CHECK (length(content) <= 5000);

-- Fix 5: Make professional data require authentication (not public)
DROP POLICY IF EXISTS "Users can view all education" ON public.education;
CREATE POLICY "Authenticated users can view education" ON public.education
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all experience" ON public.experience;
CREATE POLICY "Authenticated users can view experience" ON public.experience
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all certifications" ON public.certifications;
CREATE POLICY "Authenticated users can view certifications" ON public.certifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view all publications" ON public.publications;
CREATE POLICY "Authenticated users can view publications" ON public.publications
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix 6: Update SECURITY DEFINER functions to restrict to own data only
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own roles or if caller is admin
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_verified(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own verification or if caller is admin
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.credentials
    WHERE user_id = _user_id
      AND verification_status = 'verified'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_message_limit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own limit
  IF _user_id != auth.uid() THEN
    RETURN 0;
  END IF;
  
  RETURN CASE 
    WHEN (SELECT is_premium FROM public.profiles WHERE user_id = _user_id) = true THEN 30
    ELSE 5
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_send_message(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INTEGER;
  daily_limit INTEGER;
BEGIN
  -- Only allow checking own status
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;

  SELECT COALESCE(count, 0) INTO current_count
  FROM public.daily_message_counts
  WHERE user_id = _user_id AND message_date = CURRENT_DATE;
  
  daily_limit := public.get_daily_message_limit(_user_id);
  
  RETURN COALESCE(current_count, 0) < daily_limit;
END;
$$;