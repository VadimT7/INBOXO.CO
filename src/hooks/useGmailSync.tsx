
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

      console.log('Session found, checking token...');
      
      // Check if we have a Google provider token
      if (!session.session.provider_token) {
        console.error('No Google provider token found');
        toast.error('Google access expired. Please sign out and sign in again with Google.');
        return;
      }

      console.log('Invoking fetch-gmail-leads function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-gmail-leads', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        
        // Handle specific error cases
        if (error.message?.includes('Google access token')) {
          toast.error('Google access expired. Please sign out and sign in again with Google to re-enable Gmail sync.');
        } else if (error.message?.includes('Gmail API')) {
          toast.error('Gmail API access denied. Please ensure you granted Gmail permissions when signing in.');
        } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
          toast.error('Authentication failed. Please sign out and sign in again.');
        } else {
          toast.error(`Failed to sync Gmail: ${error.message || 'Unknown error'}`);
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
      if (!error.message?.includes('Google access') && 
          !error.message?.includes('authorization') &&
          !error.message?.includes('Gmail API') &&
          !error.message?.includes('sign in') &&
          !error.message?.includes('sign out')) {
        toast.error(`Failed to sync Gmail: ${error.message || 'Unknown error'}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { syncGmailLeads, loading };
}
