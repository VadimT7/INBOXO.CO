
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
  };
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Gmail Leads Fetch Function Started ===');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying user token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('User verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User verified, ID:', user.id);

    // Get or create the user's profile
    console.log('Fetching user profile...');
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_access_token')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('Profile not found, creating new profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          updated_at: new Date().toISOString()
        })
        .select('google_access_token')
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      profile = newProfile;
      console.log('Profile created successfully');
    } else if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile?.google_access_token) {
      console.error('No Google access token found for user');
      return new Response(
        JSON.stringify({ error: 'No Google access token found. Please sign out and sign in again with Google to enable Gmail sync.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Google access token found, testing validity...');
    
    // Test the Google access token
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${profile.google_access_token}`,
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Google token validation failed:', testResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Google access token is invalid or expired. Please sign out and sign in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token validated, fetching Gmail messages...');

    // Define keywords to filter emails - broader search for better results
    const keywords = ['inquiry', 'contact', 'quote', 'project', 'business', 'collaboration', 'proposal', 'request', 'service'];
    const keywordQuery = keywords.map(keyword => `subject:${keyword} OR body:${keyword}`).join(' OR ');
    
    // Gmail API query: unread emails with keywords
    const query = `is:unread (${keywordQuery}) newer_than:7d`;
    console.log('Gmail query:', query);

    // Fetch emails from Gmail API
    const gmailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`;
    console.log('Fetching from Gmail API:', gmailUrl);

    const listResponse = await fetch(gmailUrl, {
      headers: {
        'Authorization': `Bearer ${profile.google_access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Gmail API list error:', listResponse.status, errorText);
      
      if (listResponse.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Google access token expired. Please sign out and sign in again with Google.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (listResponse.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Gmail API access denied. Please ensure Gmail permissions were granted during sign-in.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: `Gmail API error: ${listResponse.status}` }),
          { status: listResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const listData: GmailListResponse = await listResponse.json();
    console.log('Found messages:', listData.messages?.length || 0);

    if (!listData.messages || listData.messages.length === 0) {
      console.log('No messages found');
      return new Response(
        JSON.stringify({ message: 'No new lead emails found', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch details for each message
    const leads = [];
    const messageLimit = Math.min(listData.messages.length, 10); // Process max 10 messages
    
    console.log(`Processing ${messageLimit} messages...`);
    
    for (let i = 0; i < messageLimit; i++) {
      const message = listData.messages[i];
      try {
        console.log(`Processing message ${i + 1}/${messageLimit}: ${message.id}`);
        
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${profile.google_access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!messageResponse.ok) {
          console.error(`Failed to fetch message ${message.id}: ${messageResponse.status}`);
          continue;
        }

        const messageData: GmailMessage = await messageResponse.json();
        
        // Extract headers
        const headers = messageData.payload.headers;
        const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');

        if (!fromHeader) {
          console.error(`No from header found for message ${message.id}`);
          continue;
        }

        // Extract email address from "Name <email@domain.com>" format
        const emailMatch = fromHeader.value.match(/<([^>]+)>/) || [null, fromHeader.value];
        const senderEmail = (emailMatch[1] || fromHeader.value).trim();

        // Skip if email doesn't look valid
        if (!senderEmail.includes('@') || senderEmail.includes('noreply') || senderEmail.includes('no-reply')) {
          console.log(`Skipping email: ${senderEmail} (automated or invalid)`);
          continue;
        }

        const lead = {
          user_id: user.id,
          gmail_message_id: messageData.id,
          sender_email: senderEmail,
          subject: subjectHeader?.value || 'No subject',
          snippet: messageData.snippet || '',
          received_at: new Date(parseInt(messageData.internalDate)).toISOString(),
          status: 'unclassified'
        };

        leads.push(lead);
        console.log(`✓ Lead processed: ${senderEmail} - ${subjectHeader?.value}`);

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    console.log(`Total leads to insert: ${leads.length}`);

    // Insert leads into Supabase (using upsert to handle duplicates)
    if (leads.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('leads')
        .upsert(leads, { 
          onConflict: 'user_id,gmail_message_id',
          ignoreDuplicates: true 
        })
        .select();

      if (insertError) {
        console.error('Error inserting leads:', insertError);
        return new Response(
          JSON.stringify({ error: `Failed to save leads: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✓ Successfully inserted leads:', insertData?.length || 0);
    }

    const result = { 
      message: 'Gmail leads processed successfully', 
      count: leads.length,
      processed: messageLimit,
      total_found: listData.messages.length
    };
    
    console.log('=== Function completed successfully ===', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== Error in fetch-gmail-leads function ===', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
