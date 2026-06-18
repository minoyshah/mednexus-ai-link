import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Aquilla auth, backed entirely by Supabase Auth. Mirrors the prototype's flow:
 * phone number → 6-digit OTP → verify, plus Apple/Google one-tap. No passwords.
 *
 * This is intentionally thin — it only manages the session and exposes the
 * Supabase auth calls. All authorization (who may touch a job, a price, a
 * payout) is enforced server-side by RLS and Edge Functions, never here.
 */
interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Send a 6-digit OTP to a phone number in E.164 form (e.g. +15550123456). */
  sendPhoneOtp: (phone: string) => Promise<void>;
  /** Verify the OTP code for a phone number; resolves to the signed-in session. */
  verifyPhoneOtp: (phone: string, token: string) => Promise<Session | null>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/app` : undefined;

    return {
      session,
      user: session?.user ?? null,
      loading,
      async sendPhoneOtp(phone) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
      },
      async verifyPhoneOtp(phone, token) {
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token,
          type: "sms",
        });
        if (error) throw error;
        return data.session;
      },
      async signInWithApple() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "apple",
          options: { redirectTo },
        });
        if (error) throw error;
      },
      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo },
        });
        if (error) throw error;
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
