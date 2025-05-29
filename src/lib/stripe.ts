import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripeKey) {
  throw new Error('Missing Stripe publishable key');
}

const stripePromise = loadStripe(stripeKey);

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

    const { error } = await stripe.redirectToCheckout({
      sessionId,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (err) {
    console.error('Error in createCheckoutSession:', err);
    throw err;
  }
}; 