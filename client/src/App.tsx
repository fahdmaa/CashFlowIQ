import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/direct-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase, setupAuthListener, initializeAuth } from "@/lib/supabase-auth";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Budgets from "@/pages/budgets";
import SupabaseLogin from "@/pages/supabase-login";
import EmailConfirmed from "@/pages/email-confirmed";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Handle email confirmation URLs from Supabase
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        try {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error && data.user?.email_confirmed_at) {
            // Clear URL parameters and redirect to confirmation success page
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate("/email-confirmed");
          }
        } catch (error) {
          console.error('Error setting session from URL:', error);
        }
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Switch>
      <Route path="/login" component={SupabaseLogin} />
      <Route path="/email-confirmed" component={EmailConfirmed} />
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      </Route>
      <Route path="/budgets">
        <ProtectedRoute>
          <Budgets />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Initialize auth session on app start
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = setupAuthListener((user) => {
      // Handle auth state changes if needed
      console.log('Auth state changed:', user);
    });

    // Cleanup auth listener on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
