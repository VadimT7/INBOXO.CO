
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
          redirectTo: window.location.origin, // Or a specific callback page
          // To request specific Gmail scopes, add them here, e.g.:
          // scopes: 'https://www.googleapis.com/auth/gmail.readonly',
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
      navigate('/'); // Navigate to home after logout
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
            // email is automatically in auth.users, no need to duplicate here unless specifically required
            // email: currentSession.user.email, 
          },
          { onConflict: 'id' }
        );

      if (profileError) {
        toast.error(`Failed to save profile: ${profileError.message}`);
        console.error('Error saving profile/token:', profileError);
      } else {
        console.log('Google access token saved successfully for user:', currentSession.user.id);
        // The success toast for login is better handled when the auth state change confirms login
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
        // This handles the case where the user is already logged in when the app loads
        // or returns from OAuth redirect.
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
          toast.success("You’re in. Let’s organize your leads.");
          await updateProfileWithToken(currentSession);
          // No explicit navigation here as LoginPage will handle redirect if user is logged in.
          // And other pages might redirect to login if not authenticated.
        }
        if (_event === 'TOKEN_REFRESHED' && currentSession) {
          // Handle token refresh, potentially update profile if access token changes
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
