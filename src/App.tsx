import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Auth components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

// App pages
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/app/Feed";
import Profile from "./pages/app/Profile";
import MessagesPage from "./pages/app/Messages";
import Groups from "./pages/app/Groups";
import Meetings from "./pages/app/Meetings";
import AI from "./pages/app/AI";
import Jobs from "./pages/app/Jobs";
import Settings from "./pages/app/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Legacy auth route redirect */}
            <Route path="/auth" element={<Navigate to="/login" replace />} />

            {/* Protected App Routes */}
            <Route path="/app" element={<Navigate to="/app/feed" replace />} />
            <Route path="/app/onboarding" element={
              <ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>
            } />
            <Route path="/app/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/app/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/app/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/app/meetings" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
            <Route path="/app/ai" element={<ProtectedRoute><AI /></ProtectedRoute>} />
            <Route path="/app/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/app/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Legacy route redirects */}
            <Route path="/dashboard" element={<Navigate to="/app/feed" replace />} />
            <Route path="/messages" element={<Navigate to="/app/messages" replace />} />
            <Route path="/study" element={<Navigate to="/app/ai" replace />} />
            <Route path="/profile" element={<Navigate to="/app/profile" replace />} />
            <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
