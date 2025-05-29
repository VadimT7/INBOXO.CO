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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    console.log('Initializing with Supabase URL:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Missing authorization header',
          details: 'No authorization token provided in request headers',
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Verifying user token...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError) {
      console.error('User verification error:', userError);
      return new Response(
        JSON.stringify({
          error: 'Invalid user token',
          details: userError.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          error: 'No user found',
          details: 'User token is valid but no user was found',
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('User verified, fetching profile...');

    // Get the user's Google access token from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_access_token, updated_at')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({
          error: 'Failed to fetch user profile',
          details: profileError.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!profile?.google_access_token) {
      return new Response(
        JSON.stringify({
          error: 'No Google access token found',
          details: 'Please sign out and sign in again with Google to refresh your access token',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate token freshness
    const tokenUpdatedAt = new Date(profile.updated_at);
    const tokenAge = Date.now() - tokenUpdatedAt.getTime();
    if (tokenAge > 3600000) { // Token older than 1 hour
      console.warn('Token might be stale, age:', tokenAge / 1000, 'seconds');
    }

    console.log('Testing Google token...');
    // Test the Google access token
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${profile.google_access_token}`,
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('Google token validation failed:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Google access token is invalid or expired',
          details: errorText,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Token validated, fetching Gmail messages...');

    const accessToken = profile.google_access_token;
    console.log('Using access token for Gmail API (length):', accessToken.length);

    // Define keywords to filter emails
    const keywords = ['inquiry', 'contact', 'quote', 'project', 'hello', 'request'];
    const keywordQuery = keywords.map(keyword => `subject:${keyword}`).join(' OR ');
    
    // Gmail API query: unread emails with specific keywords in subject
    const query = `is:unread (${keywordQuery})`;
    console.log('Gmail query:', query);

    // Fetch unread emails with keywords from Gmail API
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Gmail API list error:', errorText);
      
      // Handle specific error cases
      if (listResponse.status === 401) {
        throw new Error('Google access token expired. Please sign out and sign in again with Google.');
      } else if (listResponse.status === 403) {
        throw new Error('Gmail API access denied. Please ensure Gmail API is enabled in Google Cloud Console.');
      } else {
        throw new Error(`Failed to fetch emails from Gmail: ${listResponse.status} - ${errorText}`);
      }
    }

    const listData: GmailListResponse = await listResponse.json();
    console.log('Found messages:', listData.messages?.length || 0);

    if (!listData.messages || listData.messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No new lead emails found', count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch details for each message
    const leads = [];
    for (const message of listData.messages.slice(0, 10)) { // Limit to 10 messages per request
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
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
        const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');

        if (!fromHeader) {
          console.error(`No from header found for message ${message.id}`);
          continue;
        }

        // Extract email address from "Name <email@domain.com>" format
        const emailMatch = fromHeader.value.match(/<([^>]+)>/) || [null, fromHeader.value];
        const senderEmail = emailMatch[1] || fromHeader.value;

        const lead = {
          user_id: user.id,
          gmail_message_id: messageData.id,
          sender_email: senderEmail.trim(),
          subject: subjectHeader?.value || null,
          snippet: messageData.snippet || null,
          received_at: new Date(parseInt(messageData.internalDate)).toISOString(),
          status: 'unclassified'
        };

        leads.push(lead);
        console.log('Processed lead:', { sender: senderEmail, subject: subjectHeader?.value });

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    console.log('Total leads to insert:', leads.length);

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
        throw new Error(`Failed to save leads: ${insertError.message}`);
      }

      console.log('Successfully inserted leads:', insertData?.length || 0);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Gmail leads processed successfully', 
        count: leads.length,
        leads: leads.map(l => ({ sender: l.sender_email, subject: l.subject }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in fetch-gmail-leads function:', error);
    const errorResponse = {
      error: error.message || 'Unknown error occurred',
      details: error.stack || 'No stack trace available',
      context: error.context || {},
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Error-Type': 'edge-function-error'
        },
      }
    );
  }
};

serve(handler);
