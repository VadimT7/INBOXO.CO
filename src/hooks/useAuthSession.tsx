import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSignInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
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
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(`Logout failed: ${error.message}`);
      console.error('Sign-out error:', error);
    } else {
      setSession(null);
      setUser(null);
      toast.info('You have been logged out.');
      navigate('/');
    }
  };

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
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession) {
        updateProfileWithToken(currentSession);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log('Auth state change:', _event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (_event === 'SIGNED_IN' && currentSession) {
          toast.success("You're in. Let's organize your leads.");
          await updateProfileWithToken(currentSession);
        }
        if (_event === 'TOKEN_REFRESHED' && currentSession) {
          console.log('Token refreshed, updating profile...');
          await updateProfileWithToken(currentSession);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [updateProfileWithToken]);

  return { session, user, loading, signInWithGoogle: handleSignInWithGoogle, signOut: handleSignOut };
}
