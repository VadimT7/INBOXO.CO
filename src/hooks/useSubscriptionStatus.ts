import { useState, useEffect } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  status: 'free' | 'active' | 'canceled' | 'past_due' | 'trial';
  plan?: string;
  isActive: boolean;
  isCanceled: boolean;
  loading: boolean;
}

export const useSubscriptionStatus = (): SubscriptionStatus => {
  const { user } = useAuthSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    status: 'free',
    isActive: false,
    isCanceled: false,
    loading: true,
  });

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) {
        setSubscriptionStatus({
          status: 'free',
          isActive: false,
          isCanceled: false,
          loading: false,
        });
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_status, subscription_plan')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching subscription status:', error);
          setSubscriptionStatus({
            status: 'free',
            isActive: false,
            isCanceled: false,
            loading: false,
          });
          return;
        }

        const status = ((data as any)?.subscription_status || 'free') as SubscriptionStatus['status'];
        const plan = (data as any)?.subscription_plan;

        setSubscriptionStatus({
          status,
          plan,
          isActive: status === 'active' || status === 'trial',
          isCanceled: status === 'canceled',
          loading: false,
        });
      } catch (error) {
        console.error('Error in useSubscriptionStatus:', error);
        setSubscriptionStatus({
          status: 'free',
          isActive: false,
          isCanceled: false,
          loading: false,
        });
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  return subscriptionStatus;
}; 