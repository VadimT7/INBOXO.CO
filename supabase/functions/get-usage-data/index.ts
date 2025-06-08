import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.js"

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

    // Get current month usage data
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    
    const { data: usage, error: usageError } = await supabaseClient
      .from('user_usage')
      .select('*')
      .eq('user_id', user.id)
      .eq('period_month', currentMonth)
      .single()

    // Get user's subscription plan and emails_sent to determine limits
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('subscription_status, subscription_plan, emails_sent')
      .eq('id', user.id)
      .single()

    // Determine limits based on subscription plan
    let limits = {
      leads_limit: 100,
      api_limit: 1000,
      storage_limit: 0.5,
    }

    if (profile?.subscription_plan) {
      switch (profile.subscription_plan.toLowerCase()) {
        case 'starter':
          limits = { leads_limit: 1000, api_limit: 5000, storage_limit: 1 }
          break
        case 'professional':
          limits = { leads_limit: 10000, api_limit: 50000, storage_limit: 10 }
          break
        case 'enterprise':
          limits = { leads_limit: -1, api_limit: -1, storage_limit: -1 }
          break
      }
    }

    const usageData = {
      leads_processed: usage?.leads_processed || 0,
      leads_limit: limits.leads_limit,
      api_calls: usage?.api_calls_made || 0,
      api_limit: limits.api_limit,
      storage_used: (usage?.storage_used_mb || 0) / 1024, // Convert MB to GB
      storage_limit: limits.storage_limit,
      ai_responses_generated: usage?.ai_responses_generated || 0,
      emails_sent: profile?.emails_sent || 0 // Get from profiles table
    }

    return new Response(
      JSON.stringify(usageData),
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
