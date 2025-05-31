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
    if (currentSession?.user) {
      console.log('Attempting to save Google access token for user:', currentSession.user.id);
      
      // Always use provider_token for immediate access
      if (!currentSession.provider_token) {
        console.error('No provider token available in session');
        toast.error('Google access token not available. Please sign out and sign in again.');
        return;
      }

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
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        updateProfileWithToken(currentSession);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
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
            await updateProfileWithToken(currentSession);
            navigate('/leads');
          }
          if (event === 'TOKEN_REFRESHED' && currentSession) {
            console.log('Token refreshed, updating profile...');
            await updateProfileWithToken(currentSession);
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [updateProfileWithToken, navigate]);

  return {
    session,
    user,
    loading,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut
  };
}
