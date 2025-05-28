
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Processing Gmail fetch for user:', user.id);

    // Get the user's Google access token from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('google_access_token')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.google_access_token) {
      throw new Error('No Google access token found. Please re-authenticate with Google.');
    }

    const accessToken = profile.google_access_token;

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
      throw new Error(`Failed to fetch emails from Gmail: ${listResponse.status} - ${errorText}`);
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
          console.error(`Failed to fetch message ${message.id}`);
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
