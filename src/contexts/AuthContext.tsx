import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  about: string | null;
  medical_role: string | null;
  primary_specialty: string | null;
  subspecialty: string | null;
  clinical_interests: string[] | null;
  research_interests: string[] | null;
  institution: string | null;
  institution_email: string | null;
  institution_verified: boolean | null;
  is_premium: boolean | null;
  onboarding_completed: boolean | null;
}

interface VerificationStatus {
  hasCredentials: boolean;
  isVerified: boolean;
  isPending: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  verificationStatus: VerificationStatus;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    hasCredentials: false,
    isVerified: false,
    isPending: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  };

  const fetchVerificationStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('credentials')
      .select('verification_status')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching verification status:', error);
      return { hasCredentials: false, isVerified: false, isPending: false };
    }

    const hasCredentials = data && data.length > 0;
    const isVerified = data?.some(c => c.verification_status === 'verified') || false;
    const isPending = data?.some(c => c.verification_status === 'pending') || false;

    return { hasCredentials, isVerified, isPending };
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      const verStatus = await fetchVerificationStatus(user.id);
      setVerificationStatus(verStatus);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
            fetchVerificationStatus(session.user.id).then(setVerificationStatus);
          }, 0);
        } else {
          setProfile(null);
          setVerificationStatus({ hasCredentials: false, isVerified: false, isPending: false });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
        fetchVerificationStatus(session.user.id).then(setVerificationStatus);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        verificationStatus,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
