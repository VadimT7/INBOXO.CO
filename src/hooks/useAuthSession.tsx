
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
          scopes: 'https://www.googleapis.com/auth/gmail.readonly', // Request Gmail read access
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
    if (currentSession?.user && currentSession?.provider_token) {
      console.log('Attempting to save Google access token for user:', currentSession.user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: currentSession.user.id,
            google_access_token: currentSession.provider_token,
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        toast.error(`Failed to save profile: ${profileError.message}`);
        console.error('Error saving profile/token:', profileError);
      } else {
        console.log('Google access token saved successfully for user:', currentSession.user.id);
      }
    } else {
      console.log('No provider token or user in session, skipping profile update.');
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
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        if (_event === 'SIGNED_IN' && currentSession) {
          toast.success("You're in. Let's organize your leads.");
          await updateProfileWithToken(currentSession);
        }
        if (_event === 'TOKEN_REFRESHED' && currentSession) {
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
