
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
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('fetch-gmail-leads', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('Gmail sync error details:', error);
        
        // Handle specific error cases
        if (error.message?.includes('No Google access token found')) {
          toast.error('Google access expired. Please sign out and sign in again with Google to re-enable Gmail sync.');
        } else if (error.message?.includes('invalid_grant') || error.message?.includes('unauthorized')) {
          toast.error('Google authorization expired. Please sign out and sign in again.');
        } else {
          toast.error(`Failed to sync Gmail: ${error.message}`);
        }
        throw error;
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
      if (!error.message?.includes('Google access') && !error.message?.includes('authorization')) {
        toast.error(`Failed to sync Gmail: ${error.message}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { syncGmailLeads, loading };
}
