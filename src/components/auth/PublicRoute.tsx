import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Authenticated users should be redirected to the app
  if (user) {
    // If onboarding not complete, go to onboarding
    if (!profile?.onboarding_completed) {
      return <Navigate to="/app/onboarding" replace />;
    }
    // Otherwise go to feed
    return <Navigate to="/app/feed" replace />;
  }

  return <>{children}</>;
}

