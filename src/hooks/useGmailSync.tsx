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

      console.log('Invoking fetch-gmail-leads function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-gmail-leads', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        // Try to extract detailed error information
        let errorMessage = error.message;
        let errorDetails = null;
        
        if (error.message?.includes('non-2xx status code')) {
          // Handle Edge Function error response
          try {
            if (error.context?.body) {
              const errorBody = typeof error.context.body === 'string' 
                ? JSON.parse(error.context.body)
                : error.context.body;
                
              errorMessage = errorBody.error || errorMessage;
              errorDetails = errorBody.details;
            }
          } catch (e) {
            console.error('Error parsing error details:', e);
            // If we can't parse the error, use the original error message
          }
        }
        
        // Handle specific error cases
        if (errorMessage?.includes('No Google access token found') || 
            errorMessage?.includes('Google access token is invalid or expired')) {
          toast.error('Google access expired. Please sign out and sign in again with Google to re-enable Gmail sync.');
        } else if (errorMessage?.includes('invalid_grant') || 
                  errorMessage?.includes('unauthorized') ||
                  errorMessage?.includes('Token has been expired or revoked')) {
          toast.error('Google authorization expired. Please sign out and sign in again.');
        } else if (errorMessage?.includes('Gmail API access denied')) {
          toast.error('Gmail API access denied. Please ensure you granted all required permissions.');
        } else {
          toast.error(`Failed to sync Gmail: ${errorMessage}`);
        }

        if (errorDetails) {
          console.error('Error details:', errorDetails);
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('No data received from Gmail sync');
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
          !error.message?.includes('Gmail API')) {
        toast.error(`Failed to sync Gmail: ${error.message || 'Unknown error'}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { syncGmailLeads, loading };
}
