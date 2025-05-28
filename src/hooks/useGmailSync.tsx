
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
      toast.error(`Failed to sync Gmail: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { syncGmailLeads, loading };
}
