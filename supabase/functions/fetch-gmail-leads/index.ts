import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import { validateUser } from './auth-handler.ts';
import { GmailClient } from './gmail-client.ts';
import { extractEmailBody, extractEmailHeaders, isAutomatedEmail } from './email-parser.ts';
import { classifyEmailWithAI } from './ai-classifier.ts';
import { LeadData } from './types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-google-token',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Gmail Leads Fetch Function Started ===');
    
    // Validate user
    const user = await validateUser(req.headers.get('Authorization'));
    
    // Get Google access token from header (passed directly from frontend)
    const googleToken = req.headers.get('X-Google-Token');
    if (!googleToken) {
      throw new Error('No Google access token provided. Please sign out and sign in again with Google to enable Gmail sync.');
    }

    console.log('Google access token found, testing validity...');
    
    // Initialize Gmail client
    const gmailClient = new GmailClient(googleToken);
    
    // Test the Google access token
    const isValidToken = await gmailClient.validateToken();
    if (!isValidToken) {
      throw new Error('Google access token is invalid or expired. Please sign out and sign in again.');
    }

    console.log('Token validated, fetching Gmail messages...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Fetch both incoming and sent emails
    const leads: LeadData[] = [];
    let totalProcessed = 0;
    let sentEmailsProcessed = 0;

    // 1. Fetch incoming emails (potential leads)
    console.log('Fetching incoming emails...');
    const incomingQuery = `newer_than:7d`;
    const incomingData = await gmailClient.fetchMessageList(incomingQuery, 30);
    console.log('Found incoming messages:', incomingData.messages?.length || 0);

    if (incomingData.messages && incomingData.messages.length > 0) {
      const messageLimit = Math.min(incomingData.messages.length, 15);
      console.log(`Processing ${messageLimit} incoming messages with AI classification...`);
      
      for (let i = 0; i < messageLimit; i++) {
        const message = incomingData.messages[i];
        try {
          console.log(`Processing incoming message ${i + 1}/${messageLimit}: ${message.id}`);
          
          const messageData = await gmailClient.fetchMessage(message.id);
          const { senderEmail, subject } = extractEmailHeaders(messageData);
          
          console.log(`Processing email: ${subject} (from: ${senderEmail})`);

          if (isAutomatedEmail(senderEmail)) {
            console.log(`Potential automated email detected: ${senderEmail} - ${subject}`);
          }

          const body = extractEmailBody(messageData);
          console.log(`Analyzing email with AI: ${senderEmail} - ${subject}`);
          
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
          totalProcessed++;

        } catch (error) {
          console.error(`Error processing incoming message ${message.id}:`, error);
        }
      }
    }

    // 2. Fetch sent emails to track responses
    console.log('Fetching sent emails to track responses...');
    const sentQuery = `in:sent newer_than:7d`;
    const sentData = await gmailClient.fetchMessageList(sentQuery, 20);
    console.log('Found sent messages:', sentData.messages?.length || 0);

    if (sentData.messages && sentData.messages.length > 0) {
      // Get existing leads to match against sent emails
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('id, sender_email, subject, gmail_message_id')
        .eq('user_id', user.id);

      console.log(`Processing ${sentData.messages.length} sent messages to track responses...`);
      
      for (const message of sentData.messages) {
        try {
          const messageData = await gmailClient.fetchMessage(message.id);
          const { senderEmail: recipientEmail, subject } = extractEmailHeaders(messageData);
          
          // Check if this sent email is a response to an existing lead
          const matchingLead = existingLeads?.find(lead => {
            const emailMatch = lead.sender_email.toLowerCase() === recipientEmail.toLowerCase();
            const subjectMatch = subject.toLowerCase().includes('re:') || 
                                 lead.subject.toLowerCase().includes(subject.toLowerCase().replace('re:', '').trim()) ||
                                 subject.toLowerCase().includes(lead.subject.toLowerCase());
            return emailMatch && subjectMatch;
          });

          if (matchingLead) {
            console.log(`✓ Found response to lead: ${recipientEmail} - ${subject}`);
            
            // Update the lead to mark it as answered
            const { error: updateError } = await supabase
              .from('leads')
              .update({ 
                answered: true,
                answered_at: new Date(parseInt(messageData.internalDate)).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', matchingLead.id);

            if (updateError) {
              console.error('Error updating lead response status:', updateError);
            } else {
              console.log(`✓ Marked lead ${matchingLead.id} as answered`);
              sentEmailsProcessed++;
            }

            // Track the sent email in profiles table for now
            const { error: usageError } = await supabase.rpc('increment_emails_sent', {
              user_id_param: user.id
            });

            if (usageError) {
              console.error('Error updating sent email count:', usageError);
              // Fallback: try to update profiles table directly
              const { error: profileError } = await supabase
                .from('profiles')
                .update({ 
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
              
              if (profileError) {
                console.error('Error updating profile:', profileError);
              }
            }
          }

        } catch (error) {
          console.error(`Error processing sent message ${message.id}:`, error);
        }
      }
    }

    // Insert new leads into Supabase
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

      console.log('✓ Successfully inserted AI-classified leads:', insertData?.length || 0);
    }

    const result = { 
      message: 'Gmail sync completed successfully', 
      new_leads: leads.length,
      responses_tracked: sentEmailsProcessed,
      total_processed: totalProcessed,
      incoming_found: incomingData.messages?.length || 0,
      sent_found: sentData.messages?.length || 0
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
