
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import { validateUser, getUserProfile } from './auth-handler.ts';
import { GmailClient } from './gmail-client.ts';
import { extractEmailBody, extractEmailHeaders, isAutomatedEmail } from './email-parser.ts';
import { classifyEmailWithAI } from './ai-classifier.ts';
import { LeadData } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Gmail Leads Fetch Function Started ===');
    
    // Validate user and get profile
    const user = await validateUser(req.headers.get('Authorization'));
    const profile = await getUserProfile(user.id);

    console.log('Google access token found, testing validity...');
    
    // Initialize Gmail client
    const gmailClient = new GmailClient(profile.google_access_token);
    
    // Test the Google access token
    const isValidToken = await gmailClient.validateToken();
    if (!isValidToken) {
      throw new Error('Google access token is invalid or expired. Please sign out and sign in again.');
    }

    console.log('Token validated, fetching Gmail messages...');

    // Use a broad search query to get recent emails
    const query = `newer_than:7d -from:noreply -from:no-reply -from:donotreply`;
    console.log('Gmail query:', query);

    // Fetch emails from Gmail API
    const listData = await gmailClient.fetchMessageList(query, 30);
    console.log('Found messages:', listData.messages?.length || 0);

    if (!listData.messages || listData.messages.length === 0) {
      console.log('No messages found');
      return new Response(
        JSON.stringify({ message: 'No messages found in Gmail', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process messages with AI classification
    const leads: LeadData[] = [];
    const messageLimit = Math.min(listData.messages.length, 15); // Process max 15 messages
    
    console.log(`Processing ${messageLimit} messages with AI classification...`);
    
    for (let i = 0; i < messageLimit; i++) {
      const message = listData.messages[i];
      try {
        console.log(`Processing message ${i + 1}/${messageLimit}: ${message.id}`);
        
        const messageData = await gmailClient.fetchMessage(message.id);
        
        // Extract headers and body
        const { senderEmail, subject } = extractEmailHeaders(messageData);

        // Skip automated emails
        if (isAutomatedEmail(senderEmail)) {
          console.log(`Skipping automated email: ${senderEmail}`);
          continue;
        }

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

        const lead: LeadData = {
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

    // Insert leads into Supabase
    if (leads.length > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

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
