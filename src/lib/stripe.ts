import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Use environment variable if available, otherwise you'll need to set your publishable key here
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_publishable_key_here';

if (!stripeKey || stripeKey === 'pk_test_your_stripe_publishable_key_here') {
  console.warn('Stripe publishable key not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY or update the stripeKey variable in src/lib/stripe.ts');
}

// Initialize Stripe with options to handle blocked analytics
const stripePromise = loadStripe(stripeKey, {
  betas: ['analytics_disable_beta_1'],
});

// Types for real data
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export interface SubscriptionDetails {
  id: string;
  status: string;
  current_period_end: number;
  next_billing_date: string;
  amount: number;
}

export interface UsageData {
  leads_processed: number;
  leads_limit: number;
  api_calls: number;
  api_limit: number;
  storage_used: number;
  storage_limit: number;
  ai_responses_generated: number;
  emails_sent: number;
}

export const createCheckoutSession = async (priceId: string) => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    console.log('Creating checkout session for priceId:', priceId);
    console.log('Session:', session);
    console.log('Session data:', session.data);
    console.log('Session access token:', session.data.session?.access_token);

    // Use environment variable for Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    const stripe = await stripePromise;

    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    // Ignore analytics errors
    try {
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        // Only throw if it's not an analytics error
        if (!error.message?.includes('r.stripe.com') && !error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
          throw error;
        }
      }
    } catch (err: any) {
      // Ignore analytics-related errors
      if (!err.message?.includes('r.stripe.com') && !err.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        throw err;
      }
    }
  } catch (err) {
    console.error('Error in createCheckoutSession:', err);
    throw err;
  }
};

export const fetchBillingHistory = async () => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-billing-history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch billing history');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching billing history:', err);
    throw err;
  }
};

export const fetchPaymentMethods = async (): Promise<{ payment_methods: PaymentMethod[], subscription: SubscriptionDetails | null }> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-payment-methods`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payment methods');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching payment methods:', err);
    // Return empty data instead of throwing to gracefully handle errors
    return { payment_methods: [], subscription: null };
  }
};

export const fetchUsageData = async (): Promise<UsageData> => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-usage-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch usage data');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching usage data:', err);
    // Return default data instead of throwing to gracefully handle errors
    return {
      leads_processed: 0,
      leads_limit: 100,
      api_calls: 0,
      api_limit: 1000,
      storage_used: 0,
      storage_limit: 0.5,
      ai_responses_generated: 0,
      emails_sent: 0
    };
  }
};

export const cancelSubscription = async () => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return await response.json();
  } catch (err) {
    console.error('Error canceling subscription:', err);
    throw err;
  }
};

export const createPortalSession = async () => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (err) {
    console.error('Error creating portal session:', err);
    throw err;
  }
};

export const deleteAccount = async () => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }

    return await response.json();
  } catch (err) {
    console.error('Error deleting account:', err);
    throw err;
  }
};

// Start a free trial directly (no Stripe required)
export const startFreeTrial = async (planName: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not found');
    }

    // Update user profile to start trial
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        subscription_status: 'trial',
        subscription_plan: planName.toLowerCase(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        subscription_created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Clear any existing Stripe data
        stripe_customer_id: null,
        stripe_subscription_id: null
      });

    if (error) {
      console.error('Error starting trial:', error);
      throw new Error('Failed to start trial');
    }

    return { success: true };
  } catch (err) {
    console.error('Error in startFreeTrial:', err);
    throw err;
  }
};

// Upgrade from trial to paid subscription (uses Stripe)
export const upgradeFromTrial = async (priceId: string) => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    console.log('Upgrading from trial to paid subscription:', priceId);

    // Use the existing Stripe checkout session creation
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqedmsoldwhkczbkxhqo.supabase.co';
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.data.session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        mode: 'subscription', // Skip trial since they're already on trial
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    const stripe = await stripePromise;

    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw error;
    }
  } catch (err) {
    console.error('Error in upgradeFromTrial:', err);
    throw err;
  }
};
