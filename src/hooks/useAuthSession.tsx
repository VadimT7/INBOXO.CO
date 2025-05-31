
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
  const [initialized, setInitialized] = useState(false);
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
      // First clear the local state
      setSession(null);
      setUser(null);

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Logout failed: ${error.message}`);
        console.error('Sign-out error:', error);
        return;
      }

      // Clear any stored tokens or state
      localStorage.removeItem('supabase.auth.token');
      
      // Show success message and navigate
      toast.success('Successfully signed out');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      toast.error('An unexpected error occurred during sign out.');
    }
  }, [navigate]);

  const updateProfileWithToken = useCallback(async (currentSession: Session) => {
    if (currentSession?.user && currentSession.provider_token) {
      console.log('Attempting to save Google access token for user:', currentSession.user.id);
      
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
          toast.error(`Failed to save profile: ${profileError.message}`);
          console.error('Error saving profile/token:', profileError);
        } else {
          console.log('Google access token saved successfully');
        }
      } catch (error) {
        console.error('Error updating profile with token:', error);
      }
    } else if (currentSession?.user && !currentSession.provider_token) {
      console.error('No provider token available in session');
      toast.error('Google access token not available. Please sign out and sign in again.');
    }
  }, []);

  useEffect(() => {
    console.log('Auth hook initializing...');
    
    // Prevent multiple initializations
    if (initialized) {
      console.log('Already initialized, skipping...');
      return;
    }

    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        console.log('Initial session:', currentSession ? 'Found' : 'None');
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession) {
          // Use setTimeout to defer the profile update to avoid blocking
          setTimeout(() => {
            if (mounted) {
              updateProfileWithToken(currentSession);
            }
          }, 0);
        }
        
        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes
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
            toast.success("You're in. Let's organize your leads.");
            // Use setTimeout to defer navigation and profile update
            setTimeout(() => {
              if (mounted) {
                updateProfileWithToken(currentSession);
                navigate('/leads');
              }
            }, 0);
          }
          if (event === 'TOKEN_REFRESHED' && currentSession) {
            console.log('Token refreshed, updating profile...');
            setTimeout(() => {
              if (mounted) {
                updateProfileWithToken(currentSession);
              }
            }, 0);
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
  }, []); // Remove all dependencies to prevent re-initialization

  return {
    session,
    user,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut
  };
}
