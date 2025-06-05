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

    // Create a Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create a regular client for user verification
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

    console.log('Starting account deletion for user:', user.id)

    // Get user's profile to check for Stripe data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    // Cancel Stripe subscription if exists
    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id)
        console.log('Canceled Stripe subscription:', profile.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError)
        // Continue with deletion even if Stripe cancellation fails
      }
    }

    // Delete Stripe customer if exists
    if (profile?.stripe_customer_id) {
      try {
        await stripe.customers.del(profile.stripe_customer_id)
        console.log('Deleted Stripe customer:', profile.stripe_customer_id)
      } catch (stripeError) {
        console.error('Error deleting Stripe customer:', stripeError)
        // Continue with deletion even if Stripe deletion fails
      }
    }

    // Delete user data from all tables (in order due to foreign key constraints)
    
    // Delete user settings
    const { error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)
    
    if (settingsError) {
      console.error('Error deleting user settings:', settingsError)
    }

    // Delete user writing style
    const { error: writingStyleError } = await supabaseAdmin
      .from('user_writing_style')
      .delete()
      .eq('user_id', user.id)
    
    if (writingStyleError) {
      console.error('Error deleting user writing style:', writingStyleError)
    }

    // Delete AI response history
    const { error: aiHistoryError } = await supabaseAdmin
      .from('ai_response_history')
      .delete()
      .eq('user_id', user.id)
    
    if (aiHistoryError) {
      console.error('Error deleting AI response history:', aiHistoryError)
    }

    // Delete user usage data
    const { error: userUsageError } = await supabaseAdmin
      .from('user_usage')
      .delete()
      .eq('user_id', user.id)
    
    if (userUsageError) {
      console.error('Error deleting user usage:', userUsageError)
    }

    // Delete user stats
    const { error: userStatsError } = await supabaseAdmin
      .from('user_stats')
      .delete()
      .eq('user_id', user.id)
    
    if (userStatsError) {
      console.error('Error deleting user stats:', userStatsError)
    }

    // Delete leads
    const { error: leadsError } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('user_id', user.id)
    
    if (leadsError) {
      console.error('Error deleting leads:', leadsError)
    }

    // Delete usage data (legacy table name if it exists)
    const { error: usageError } = await supabaseAdmin
      .from('usage_data')
      .delete()
      .eq('user_id', user.id)
    
    if (usageError) {
      console.error('Error deleting usage data:', usageError)
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)
    
    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // Finally, delete the auth user (this must be last)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteUserError) {
      console.error('Error deleting auth user:', deleteUserError)
      throw new Error('Failed to delete user account')
    }

    console.log('Successfully deleted account for user:', user.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Account deleted successfully'
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
    console.error('Error deleting account:', error.message)
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
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    )
  }
}) 