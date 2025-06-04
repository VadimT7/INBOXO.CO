import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';

export type UsageAction = 
  | 'lead_processed'
  | 'api_call_made'
  | 'ai_response_generated'
  | 'email_sent'
  | 'storage_used';

interface UsageTrackingOptions {
  leadDelta?: number;
  apiCallDelta?: number;
  aiResponseDelta?: number;
  emailDelta?: number;
  storageMbDelta?: number;
}

export const useUsageTracking = () => {
  const { user } = useAuthSession();

  const trackUsage = useCallback(async (
    action: UsageAction,
    options: UsageTrackingOptions = {}
  ) => {
    if (!user?.id) {
      console.warn('Cannot track usage: user not authenticated');
      return;
    }

    try {
      // Default values based on action type
      const {
        leadDelta = action === 'lead_processed' ? 1 : 0,
        apiCallDelta = action === 'api_call_made' ? 1 : 0,
        aiResponseDelta = action === 'ai_response_generated' ? 1 : 0,
        emailDelta = action === 'email_sent' ? 1 : 0,
        storageMbDelta = action === 'storage_used' ? 1 : 0,
      } = options;

      // Call the database function to update usage
      const { error } = await supabase.rpc('upsert_current_month_usage', {
        p_user_id: user.id,
        p_leads_delta: leadDelta,
        p_api_calls_delta: apiCallDelta,
        p_ai_responses_delta: aiResponseDelta,
        p_emails_delta: emailDelta,
        p_storage_mb_delta: storageMbDelta,
      });

      if (error) {
        console.error('Error tracking usage:', error);
      }
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  }, [user?.id]);

  const trackLeadProcessed = useCallback(() => {
    return trackUsage('lead_processed');
  }, [trackUsage]);

  const trackApiCall = useCallback(() => {
    return trackUsage('api_call_made');
  }, [trackUsage]);

  const trackAiResponse = useCallback(() => {
    return trackUsage('ai_response_generated');
  }, [trackUsage]);

  const trackEmailSent = useCallback(() => {
    return trackUsage('email_sent');
  }, [trackUsage]);

  const trackStorageUsed = useCallback((mbUsed: number) => {
    return trackUsage('storage_used', { storageMbDelta: mbUsed });
  }, [trackUsage]);

  const trackBulkUsage = useCallback((options: UsageTrackingOptions) => {
    return trackUsage('api_call_made', options); // Use any action as base
  }, [trackUsage]);

  return {
    trackUsage,
    trackLeadProcessed,
    trackApiCall,
    trackAiResponse,
    trackEmailSent,
    trackStorageUsed,
    trackBulkUsage,
  };
}; 