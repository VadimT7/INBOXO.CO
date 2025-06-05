
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';

interface UsageData {
  leads_processed: number;
  api_calls_made: number;
  storage_used_mb: number;
  ai_responses_generated: number;
  emails_sent: number;
}

export function useUsageTracking() {
  const { user } = useAuthSession();
  const [usage, setUsage] = useState<UsageData>({
    leads_processed: 0,
    api_calls_made: 0,
    storage_used_mb: 0,
    ai_responses_generated: 0,
    emails_sent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user]);

  const fetchUsage = async () => {
    if (!user) return;

    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('period_month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage:', error);
        return;
      }

      if (data) {
        setUsage({
          leads_processed: data.leads_processed || 0,
          api_calls_made: data.api_calls_made || 0,
          storage_used_mb: data.storage_used_mb || 0,
          ai_responses_generated: data.ai_responses_generated || 0,
          emails_sent: data.emails_sent || 0
        });
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: keyof UsageData, amount: number = 1) => {
    if (!user) return;

    try {
      const result = await supabase.rpc('upsert_current_month_usage', {
        p_user_id: user.id,
        p_leads_delta: type === 'leads_processed' ? amount : 0,
        p_api_calls_delta: type === 'api_calls_made' ? amount : 0,
        p_storage_mb_delta: type === 'storage_used_mb' ? amount : 0,
        p_ai_responses_delta: type === 'ai_responses_generated' ? amount : 0,
        p_emails_delta: type === 'emails_sent' ? amount : 0
      });

      if (result.error) {
        console.error('Error updating usage:', result.error);
        return;
      }

      // Update local state
      setUsage(prev => ({
        ...prev,
        [type]: prev[type] + amount
      }));
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  };

  return {
    usage,
    loading,
    incrementUsage,
    refetch: fetchUsage
  };
}
