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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the user by extracting the token properly
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('User verification failed:', userError)
      throw new Error('Unauthorized')
    }

    // Get user's Stripe subscription ID from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      throw new Error('No active subscription found')
    }

    if (profile.subscription_status !== 'active') {
      throw new Error('Subscription is not active')
    }

    // Cancel the subscription at period end
    const canceledSubscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    )

    // Update the profile with canceled status
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        subscription_status: 'canceled',
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating profile:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        canceled_at: canceledSubscription.canceled_at,
        current_period_end: canceledSubscription.current_period_end,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message === 'Unauthorized' ? 401 : 400,
      }
    )
  }
}) 