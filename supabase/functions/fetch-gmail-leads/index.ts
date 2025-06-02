
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
    body?: {
      data?: string;
    };
  };
}

interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

interface AIClassificationResult {
  isLead: boolean;
  classification: 'hot' | 'warm' | 'cold' | 'unclassified';
  confidence: number;
  reasoning: string;
}

// Function to extract email body text
function extractEmailBody(messageData: GmailMessage): string {
  let bodyText = '';
  
  // Try to get the body from the main payload
  if (messageData.payload.body?.data) {
    try {
      bodyText = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (e) {
      console.error('Error decoding body data:', e);
    }
  }
  
  // If no body in main payload, check parts
  if (!bodyText && messageData.payload.parts) {
    for (const part of messageData.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        try {
          bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          break;
        } catch (e) {
          console.error('Error decoding part data:', e);
        }
      }
    }
  }
  
  // Fallback to snippet if no body found
  if (!bodyText) {
    bodyText = messageData.snippet || '';
  }
  
  // Clean up the text (remove HTML tags, extra whitespace)
  return bodyText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Function to classify email using OpenAI
async function classifyEmailWithAI(subject: string, body: string, senderEmail: string): Promise<AIClassificationResult> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    console.error('OpenAI API key not found');
    return {
      isLead: false,
      classification: 'unclassified',
      confidence: 0,
      reasoning: 'OpenAI API key not configured'
    };
  }

  const prompt = `Analyze this email to determine if it's a potential business lead and classify it. 

Email Details:
- From: ${senderEmail}
- Subject: ${subject}
- Body: ${body.substring(0, 1000)} ${body.length > 1000 ? '...' : ''}

Please analyze this email and respond with a JSON object containing:
1. "isLead" (boolean): true if this appears to be a genuine business inquiry/lead
2. "classification" (string): one of "hot", "warm", "cold", or "unclassified"
   - "hot": Urgent requests, ready to buy, specific project needs, mentions budget/timeline
   - "warm": General inquiries, interested prospects, requests for information
   - "cold": Generic messages, potential spam, unclear intent
   - "unclassified": Cannot determine or clearly not a lead
3. "confidence" (number): 0-100 confidence score
4. "reasoning" (string): Brief explanation of the classification

Consider these factors:
- Urgency indicators (urgent, ASAP, deadline)
- Purchase intent (buy, purchase, quote, proposal)
- Specific project mentions
- Budget/timeline references
- Professional language vs spam-like content
- Sender email legitimacy

Exclude newsletters, automated emails, notifications, and obvious spam.

Respond only with valid JSON.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing business emails to identify and classify potential leads. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return {
        isLead: false,
        classification: 'unclassified',
        confidence: 0,
        reasoning: 'OpenAI API error'
      };
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('AI Classification Response:', aiResponse);
    
    try {
      const result = JSON.parse(aiResponse);
      return {
        isLead: Boolean(result.isLead),
        classification: result.classification || 'unclassified',
        confidence: Number(result.confidence) || 0,
        reasoning: result.reasoning || 'No reasoning provided'
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, 'Response:', aiResponse);
      return {
        isLead: false,
        classification: 'unclassified',
        confidence: 0,
        reasoning: 'Failed to parse AI response'
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return {
      isLead: false,
      classification: 'unclassified',
      confidence: 0,
      reasoning: 'OpenAI API call failed'
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Gmail Leads Fetch Function Started ===');
    
    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client for auth verification (using anon key)
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey!);
    
    // Create client for database operations (using service role)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
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

    // Use a broad search query to get recent emails
    const query = `newer_than:7d -from:noreply -from:no-reply -from:donotreply`;
    console.log('Gmail query:', query);

    // Fetch emails from Gmail API
    const gmailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=30`;
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
        JSON.stringify({ message: 'No messages found in Gmail', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process messages with AI classification
    const leads = [];
    const messageLimit = Math.min(listData.messages.length, 15); // Process max 15 messages
    
    console.log(`Processing ${messageLimit} messages with AI classification...`);
    
    for (let i = 0; i < messageLimit; i++) {
      const message = listData.messages[i];
      try {
        console.log(`Processing message ${i + 1}/${messageLimit}: ${message.id}`);
        
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
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

        // Skip if email doesn't look valid or is from automated senders
        if (!senderEmail.includes('@') || 
            senderEmail.toLowerCase().includes('noreply') || 
            senderEmail.toLowerCase().includes('no-reply') ||
            senderEmail.toLowerCase().includes('donotreply') ||
            senderEmail.toLowerCase().includes('notification') ||
            senderEmail.toLowerCase().includes('automated')) {
          console.log(`Skipping automated email: ${senderEmail}`);
          continue;
        }

        const subject = subjectHeader?.value || '';
        const body = extractEmailBody(messageData);
        
        console.log(`Analyzing email with AI: ${senderEmail} - ${subject}`);
        
        // Use AI to classify the email
        const aiResult = await classifyEmailWithAI(subject, body, senderEmail);
        
        console.log(`AI Classification: isLead=${aiResult.isLead}, classification=${aiResult.classification}, confidence=${aiResult.confidence}`);
        
        if (!aiResult.isLead) {
          console.log(`AI classified as non-lead: ${senderEmail} - ${subject}`);
          continue;
        }

        console.log(`✓ AI detected lead: ${senderEmail} - ${subject} (${aiResult.classification}, ${aiResult.confidence}% confidence)`);

        const lead = {
          user_id: user.id,
          gmail_message_id: messageData.id,
          sender_email: senderEmail,
          subject: subject,
          snippet: messageData.snippet || body.substring(0, 200),
          received_at: new Date(parseInt(messageData.internalDate)).toISOString(),
          status: aiResult.classification,
          notes: `AI Classification: ${aiResult.reasoning} (Confidence: ${aiResult.confidence}%)`
        };

        leads.push(lead);

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    console.log(`Total AI-classified leads to insert: ${leads.length}`);

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

      console.log('✓ Successfully inserted AI-classified leads:', insertData?.length || 0);
    }

    const result = { 
      message: 'Gmail leads processed successfully with AI classification', 
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
