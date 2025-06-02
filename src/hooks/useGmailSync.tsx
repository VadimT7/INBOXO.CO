
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useGmailSync() {
  const [loading, setLoading] = useState(false);

  const syncGmailLeads = async () => {
    setLoading(true);
    try {
      console.log('Starting Gmail sync...');
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('No active session found');
        toast.error('Please sign in to sync Gmail');
        return;
      }

      console.log('Session: ', session);
      console.log('Session found, invoking fetch-gmail-leads function...');
      console.log('Access Token: ', session.session.access_token);
      const { data, error } = await supabase.functions.invoke('fetch-gmail-leads', {
        headers: {
          Authorization: 'Bearer ' + session.session.access_token,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        // Handle specific error cases with more detailed messages
        const errorMessage = error.message || 'Unknown error';
        
        if (errorMessage.includes('Google access token')) {
          toast.error('Google access expired. Please sign out and sign in again with Google to re-enable Gmail sync.');
        } else if (errorMessage.includes('Gmail API')) {
          toast.error('Gmail API access denied. Please ensure you granted Gmail permissions when signing in.');
        } else if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
          toast.error('Authentication failed. Please sign out and sign in again.');
        } else if (errorMessage.includes('403')) {
          toast.error('Access denied. Please check your Gmail permissions.');
        } else if (errorMessage.includes('No Google access token found')) {
          toast.error('No Google access token found. Please sign out and sign in again with Google.');
        } else {
          toast.error(`Failed to sync Gmail: ${errorMessage}`);
        }
        
        throw error;
      }

      if (!data) {
        console.error('No data received from Gmail sync');
        toast.error('No response from Gmail sync service');
        return;
      }

      console.log('Gmail sync result:', data);
      
      if (data.count > 0) {
        toast.success(`Found ${data.count} new leads from your Gmail!`);
      } else {
        toast.info('No new leads found in your Gmail');
      }

      return data;
    } catch (error: any) {
      console.error('Gmail sync error:', error);
      
      // Only show generic error if we haven't already shown a specific one
      const errorMessage = error.message || 'Unknown error';
      if (!errorMessage.includes('Google access') && 
          !errorMessage.includes('authorization') &&
          !errorMessage.includes('Gmail API') &&
          !errorMessage.includes('sign in') &&
          !errorMessage.includes('sign out') &&
          !errorMessage.includes('Access denied')) {
        toast.error(`Failed to sync Gmail: ${errorMessage}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { syncGmailLeads, loading };
}
