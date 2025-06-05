
import { useState, useEffect } from 'react';
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
      // For now, return default usage data since the user_usage table doesn't exist yet
      // This will be updated when the proper database structure is in place
      setUsage({
        leads_processed: 0,
        api_calls_made: 0,
        storage_used_mb: 0,
        ai_responses_generated: 0,
        emails_sent: 0
      });
    } catch (error) {
      console.error('Error fetching usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: keyof UsageData, amount: number = 1) => {
    if (!user) return;

    try {
      // Update local state for now
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
