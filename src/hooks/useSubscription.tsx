
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSession } from './useAuthSession';

interface SubscriptionData {
  subscription_status: string;
  subscription_plan?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  trial_ends_at?: string;
  subscription_created_at?: string;
}

interface UseSubscriptionReturn {
  subscriptionData: SubscriptionData | null;
  loading: boolean;
  needsSubscription: boolean;
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, loading: authLoading } = useAuthSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    if (!user) {
      setSubscriptionData(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching subscription data:', error);
        // If profile doesn't exist, create one with default values
        if (error.code === 'PGRST116') {
          const { error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              updated_at: new Date().toISOString()
            });
          
          if (!createError) {
            setSubscriptionData({ subscription_status: 'free' });
          }
        } else {
          // Set default subscription data on other errors
          setSubscriptionData({ subscription_status: 'free' });
        }
        setLoading(false);
        return;
      }

      if (data) {
        setSubscriptionData({
          subscription_status: data.subscription_status || 'free',
          subscription_plan: data.subscription_plan,
          stripe_customer_id: data.stripe_customer_id,
          stripe_subscription_id: data.stripe_subscription_id,
          trial_ends_at: data.trial_ends_at,
          subscription_created_at: data.subscription_created_at
        });
      } else {
        setSubscriptionData({ subscription_status: 'free' });
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setSubscriptionData({ subscription_status: 'free' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSubscriptionData();
    }
  }, [user?.id, authLoading]);

  // Determine if user needs to see subscription page
  const needsSubscription = (() => {
    if (!subscriptionData) return false;
    
    // Check if user has explicitly skipped subscription page recently
    const subscriptionPageSeen = localStorage.getItem('subscriptionPageSeen');
    const userHasLoggedIn = localStorage.getItem('userHasLoggedIn');
    
    // If user is on free plan and hasn't seen subscription page in this session, show it
    // But only for fresh sign-ups, not existing users
    const isNewUser = !userHasLoggedIn || userHasLoggedIn === 'false';
    const hasActiveSubscription = subscriptionData.subscription_status === 'active' || 
                                 subscriptionData.subscription_status === 'trial';
    
    // Show subscription page if:
    // 1. User is new (fresh sign-up)
    // 2. User doesn't have an active subscription
    // 3. User hasn't seen the subscription page in this session
    return isNewUser && !hasActiveSubscription && !subscriptionPageSeen;
  })();

  const refreshSubscription = async () => {
    setLoading(true);
    await fetchSubscriptionData();
  };

  return {
    subscriptionData,
    loading,
    needsSubscription,
    refreshSubscription
  };
}
