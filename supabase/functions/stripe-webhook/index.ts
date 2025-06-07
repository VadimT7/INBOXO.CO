import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.js"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapping of Stripe price IDs to plan names
const PRICE_TO_PLAN_MAP: Record<string, string> = {
  'price_1RUAFAR4VctRXueqTXYvL5w8': 'starter',
  'price_1RUAFPR4VctRXueqhOyOSFnq': 'professional', 
  'price_1RUAHbR4VctRXueqklf7r7hi': 'enterprise'
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Stripe webhook received')
    
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Missing webhook secret')
    }

    // Get the Stripe signature from headers
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('Missing stripe signature')
    }

    // Get the raw body
    const body = await req.text()

    let event: Stripe.Event

    try {
      // Verify the webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('Webhook signature verified, event type:', event.type)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response(
        JSON.stringify({ error: 'Webhook signature verification failed' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('Processing checkout.session.completed event')
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.customer && session.metadata?.userId) {
          console.log('Processing subscription checkout for user:', session.metadata.userId)
          
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const planName = PRICE_TO_PLAN_MAP[priceId] || 'professional'

          console.log('Updating subscription for user:', session.metadata.userId, 'plan:', planName)

          // Update the user's profile with subscription info
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_plan: planName,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_created_at: new Date().toISOString(),
              trial_ends_at: null, // Clear trial since they're now paying
              updated_at: new Date().toISOString()
            })
            .eq('id', session.metadata.userId)

          if (updateError) {
            console.error('Error updating user profile:', updateError)
            throw new Error('Failed to update user subscription')
          }

          console.log('Successfully updated subscription for user:', session.metadata.userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        console.log('Processing invoice.payment_succeeded event')
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription && invoice.customer) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          const priceId = subscription.items.data[0]?.price.id
          const planName = PRICE_TO_PLAN_MAP[priceId] || 'professional'

          // Find user by stripe customer ID
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', invoice.customer as string)
            .single()

          if (profileError || !profile) {
            console.error('Could not find user profile for customer:', invoice.customer)
            break
          }

          console.log('Updating subscription renewal for user:', profile.id)

          // Update subscription status to active (in case it was past_due)
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'active',
              subscription_plan: planName,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('Error updating user profile on payment:', updateError)
          } else {
            console.log('Successfully updated subscription renewal for user:', profile.id)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        console.log('Processing invoice.payment_failed event')
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.customer) {
          // Find user by stripe customer ID
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', invoice.customer as string)
            .single()

          if (profileError || !profile) {
            console.error('Could not find user profile for customer:', invoice.customer)
            break
          }

          console.log('Updating subscription to past_due for user:', profile.id)

          // Update subscription status to past_due
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('Error updating user profile on payment failure:', updateError)
          } else {
            console.log('Successfully updated subscription to past_due for user:', profile.id)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        console.log('Processing customer.subscription.deleted event')
        const subscription = event.data.object as Stripe.Subscription

        if (subscription.customer) {
          // Find user by stripe customer ID
          const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', subscription.customer as string)
            .single()

          if (profileError || !profile) {
            console.error('Could not find user profile for customer:', subscription.customer)
            break
          }

          console.log('Updating subscription to canceled for user:', profile.id)

          // Update subscription status to canceled
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              subscription_status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error('Error updating user profile on cancellation:', updateError)
          } else {
            console.log('Successfully updated subscription to canceled for user:', profile.id)
          }
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 