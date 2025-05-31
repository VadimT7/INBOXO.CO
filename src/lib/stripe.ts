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

export const createCheckoutSession = async (priceId: string) => {
  try {
    const session = await supabase.auth.getSession();
    if (!session.data.session?.access_token) {
      throw new Error('Not authenticated');
    }

    // Update to use Supabase Edge Function URL
    const response = await fetch('https://inboxflows-hero-glow.supabase.co/functions/v1/create-checkout-session', {
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
