
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthSession {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuthSession(): AuthSession {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignInWithGoogle = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/leads`,
          scopes: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        },
      });
      if (error) {
        toast.error(`Login failed: ${error.message}`);
        console.error('Google sign-in error:', error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred during Google sign-in.');
      console.error('Unexpected Google sign-in error:', error);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      setSession(null);
      setUser(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Logout failed: ${error.message}`);
        console.error('Sign-out error:', error);
        return;
      }

      localStorage.removeItem('supabase.auth.token');
      toast.success('Successfully signed out');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('An unexpected error occurred during sign out.');
    }
  }, [navigate]);

  const updateProfileWithToken = useCallback(async (currentSession: Session) => {
    if (currentSession?.user && currentSession.provider_token) {
      console.log('Saving Google access token for user:', currentSession.user.id);
      
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: currentSession.user.id,
              google_access_token: currentSession.provider_token,
              updated_at: new Date().toISOString()
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error('Error saving profile/token:', profileError);
        } else {
          console.log('✓ Google access token saved successfully');
        }
      } catch (error) {
        console.error('Error updating profile with token:', error);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log('Initial session:', currentSession ? 'Found' : 'None');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession) {
          updateProfileWithToken(currentSession);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          navigate('/', { replace: true });
        } else {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (event === 'SIGNED_IN' && currentSession) {
            // Only show welcome toast once per session
            const welcomeShown = sessionStorage.getItem('welcomeToastShown');
            
            // Check if this is a fresh login or a page refresh
            const isInitialSignIn = !localStorage.getItem('userHasLoggedIn');
            
            if (!welcomeShown) {
              toast.success("You're in. Let's organize your leads.");
              sessionStorage.setItem('welcomeToastShown', 'true');
            }
            
            // Only navigate to leads page on initial sign-in, not on page refreshes
            if (isInitialSignIn) {
              localStorage.setItem('userHasLoggedIn', 'true');
              navigate('/leads');
            }
            
            updateProfileWithToken(currentSession);
          }
          
          if (event === 'TOKEN_REFRESHED' && currentSession) {
            console.log('Token refreshed, updating profile...');
            updateProfileWithToken(currentSession);
            // Do not navigate on token refresh
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate, updateProfileWithToken]);

  return {
    session,
    user,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut
  };
}
