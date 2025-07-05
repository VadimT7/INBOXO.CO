import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserProfile {
  id: string;
  email?: string;
  google_refresh_token?: string;
  last_auto_sync?: string;
  auto_sync_enabled?: boolean;
}

interface SyncResult {
  success: boolean;
  error?: string;
  newLeads?: number;
  totalEmails?: number;
  userId: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = new Date();
  console.log(`🕐 Scheduled auto-sync starting at: ${startTime.toISOString()}`);

  try {
    // Verify required environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];

    for (const envVar of requiredEnvVars) {
      if (!Deno.env.get(envVar)) {
        throw new Error(`Missing required environment variable: ${envVar}`);
      }
    }

    // Create Supabase client with service role for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users who need auto-sync
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, google_refresh_token, last_auto_sync, auto_sync_enabled')
      .eq('auto_sync_enabled', true)
      .not('google_refresh_token', 'is', null)

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError);
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('📭 No users found with auto-sync enabled');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users with auto-sync enabled',
          users_processed: 0,
          execution_time_ms: Date.now() - startTime.getTime()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`👥 Found ${profiles.length} users with auto-sync enabled`);

    // Filter users who haven't been synced in the last 4 minutes (to account for timing variations)
    const now = new Date();
    const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);
    
    const usersToSync = profiles.filter(profile => {
      if (!profile.last_auto_sync) {
        console.log(`🆕 User ${profile.email || profile.id} never synced - adding to sync queue`);
        return true; // Never synced, should sync
      }
      const lastSync = new Date(profile.last_auto_sync);
      const shouldSync = lastSync < fourMinutesAgo;
      
      if (shouldSync) {
        const minutesSinceLastSync = Math.floor((now.getTime() - lastSync.getTime()) / 1000 / 60);
        console.log(`🔄 User ${profile.email || profile.id} last synced ${minutesSinceLastSync}m ago - adding to sync queue`);
      } else {
        console.log(`⏸️ User ${profile.email || profile.id} recently synced - skipping`);
      }
      
      return shouldSync;
    });

    console.log(`🔄 ${usersToSync.length} users need syncing (haven't synced in last 4 minutes)`);

    if (usersToSync.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All users recently synced',
          users_processed: 0,
          execution_time_ms: Date.now() - startTime.getTime()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each user's auto-sync with controlled concurrency
    const batchSize = 3; // Process 3 users at a time to avoid overwhelming APIs
    const syncResults: SyncResult[] = [];
    
    for (let i = 0; i < usersToSync.length; i += batchSize) {
      const batch = usersToSync.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersToSync.length / batchSize)} (${batch.length} users)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(profile => syncUserGmail(supabaseAdmin, profile))
      );
      
      // Collect results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const profile = batch[j];
        
        if (result.status === 'fulfilled') {
          syncResults.push({
            success: true,
            userId: profile.id,
            ...result.value
          });
        } else {
          console.error(`❌ Sync failed for user ${profile.email || profile.id}:`, result.reason);
          syncResults.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            userId: profile.id
          });
        }
      }
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < usersToSync.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Count results and log summary
    const successful = syncResults.filter(result => result.success).length;
    const failed = syncResults.filter(result => !result.success).length;
    const totalNewLeads = syncResults
      .filter(result => result.success)
      .reduce((sum, result) => sum + (result.newLeads || 0), 0);
    
    const executionTime = Date.now() - startTime.getTime();
    
    console.log(`✅ Auto-sync complete: ${successful} successful, ${failed} failed, ${totalNewLeads} total new leads found`);
    console.log(`⏱️ Total execution time: ${executionTime}ms`);

    // Log any failures for monitoring
    if (failed > 0) {
      const failedUsers = syncResults
        .filter(result => !result.success)
        .map(result => ({ userId: result.userId, error: result.error }));
      console.error('❌ Failed syncs:', failedUsers);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Auto-sync completed`,
        users_processed: usersToSync.length,
        successful: successful,
        failed: failed,
        total_new_leads: totalNewLeads,
        execution_time_ms: executionTime,
        timestamp: startTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const executionTime = Date.now() - startTime.getTime();
    console.error('❌ Scheduled auto-sync failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        execution_time_ms: executionTime,
        timestamp: startTime.toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function syncUserGmail(supabaseAdmin: any, profile: UserProfile): Promise<Partial<SyncResult>> {
  const userIdentifier = profile.email || profile.id;
  console.log(`🔄 Starting sync for user: ${userIdentifier}`);
  
  try {
    // Get a fresh access token using the refresh token
    const accessToken = await refreshGoogleToken(profile.google_refresh_token!);
    
    if (!accessToken) {
      const error = `Failed to refresh Google token for user ${userIdentifier}`;
      console.error(`❌ ${error}`);
      
      // Update profile to disable auto-sync if token refresh fails
      await supabaseAdmin
        .from('profiles')
        .update({ auto_sync_enabled: false })
        .eq('id', profile.id);
        
      throw new Error(error);
    }

    console.log(`✅ Token refreshed successfully for user: ${userIdentifier}`);

    // Call the existing fetch-gmail-leads function
    const syncResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-gmail-leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'X-Google-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        period: 1, // Sync last 24 hours for auto-sync
        user_id: profile.id // Pass user ID for admin context
      })
    });

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      console.error(`❌ Gmail sync API failed for user ${userIdentifier} (${syncResponse.status}):`, errorText);
      throw new Error(`Gmail sync API failed: ${syncResponse.status} - ${errorText}`);
    }

    const syncData = await syncResponse.json();
    console.log(`📧 Sync result for ${userIdentifier}:`, {
      newLeads: syncData.new_leads || 0,
      totalEmails: syncData.total_new_emails || 0
    });

    // Update last auto-sync timestamp
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ last_auto_sync: new Date().toISOString() })
      .eq('id', profile.id);

    if (updateError) {
      console.error(`⚠️ Failed to update last_auto_sync for user ${userIdentifier}:`, updateError);
      // Don't fail the entire sync for this
    }

    // If new leads found, process auto-replies
    if (syncData.new_leads_data && syncData.new_leads_data.length > 0) {
      console.log(`🤖 Processing auto-replies for user ${userIdentifier}: ${syncData.new_leads_data.length} new leads`);
      await processAutoReplies(supabaseAdmin, profile.id, syncData.new_leads_data);
    }

    console.log(`✅ Sync completed successfully for user: ${userIdentifier}`);
    return { 
      success: true, 
      newLeads: syncData.new_leads || 0,
      totalEmails: syncData.total_new_emails || 0
    };

  } catch (error) {
    console.error(`❌ Error syncing user ${userIdentifier}:`, error.message);
    throw error; // Re-throw for proper error handling in the main function
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  try {
    console.log('🔄 Refreshing Google access token...');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to refresh Google token (${response.status}):`, errorText);
      
      // Parse error response for better debugging
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error === 'invalid_grant') {
          console.error('❌ Refresh token is invalid or expired - user needs to re-authenticate');
        }
      } catch (e) {
        // Error text is not JSON, that's fine
      }
      
      return null;
    }

    const data = await response.json();
    console.log('✅ Google access token refreshed successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ Error refreshing Google token:', error);
    return null;
  }
}

async function processAutoReplies(supabaseAdmin: any, userId: string, newLeads: any[]) {
  try {
    console.log(`🤖 Processing auto-replies for user ${userId}: ${newLeads.length} new leads`);

    // Get user's auto-reply settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (settingsError) {
      console.log(`⚠️ Could not fetch auto-reply settings for user ${userId}:`, settingsError.message);
      return;
    }

    if (!settings?.settings?.autoReply?.enabled) {
      console.log(`🔕 Auto-reply disabled for user ${userId}`);
      return;
    }

    const autoReplySettings = settings.settings.autoReply;
    console.log(`✅ Auto-reply is enabled for user ${userId}`);

    // Filter for hot/warm leads that haven't been answered
    const leadsToReply = newLeads.filter(lead => 
      (lead.status === 'hot' || lead.status === 'warm') && 
      !lead.answered && 
      !lead.auto_replied
    );

    if (leadsToReply.length === 0) {
      console.log(`📭 No hot/warm leads to auto-reply for user ${userId}`);
      return;
    }

    console.log(`🔥 Processing ${leadsToReply.length} hot/warm leads for auto-reply`);

    // Process auto-replies with controlled concurrency
    let successCount = 0;
    let failCount = 0;
    
    for (const lead of leadsToReply) {
      try {
        console.log(`🤖 Sending auto-reply to ${lead.sender_email} for user ${userId}`);

        // Call the send-email-reply function
        const replyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-reply`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: lead.id,
            message: '', // Will be generated by AI
            isAutoReply: true,
            tone: autoReplySettings.tone || 'professional',
            length: autoReplySettings.length || 'medium',
            writingStyle: autoReplySettings.writingStyle || 'business',
            user_id: userId // Admin context
          })
        });

        if (replyResponse.ok) {
          console.log(`✅ Auto-reply sent successfully to ${lead.sender_email}`);
          successCount++;
        } else {
          const errorText = await replyResponse.text();
          console.error(`❌ Auto-reply failed for ${lead.sender_email} (${replyResponse.status}):`, errorText);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Error sending auto-reply to ${lead.sender_email}:`, error);
        failCount++;
      }
      
      // Small delay between auto-replies to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`🤖 Auto-reply processing complete for user ${userId}: ${successCount} sent, ${failCount} failed`);

  } catch (error) {
    console.error(`❌ Error processing auto-replies for user ${userId}:`, error);
  }
} 