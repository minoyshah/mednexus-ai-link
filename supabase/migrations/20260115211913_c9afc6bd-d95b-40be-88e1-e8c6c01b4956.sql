-- Fix profiles table exposure: Restrict to authenticated users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fix connections update policy to restrict what each party can change  
DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;

-- Only recipient can change status (accept/reject), requester can only withdraw (delete)
CREATE POLICY "Recipients can update connection status" ON public.connections
  FOR UPDATE 
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);