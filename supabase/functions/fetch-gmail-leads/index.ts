import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

import { validateUser } from './auth-handler.ts';
import { GmailClient } from './gmail-client.ts';
import { extractEmailBody, extractEmailHeaders, isAutomatedEmail, detectUrgencyLevel } from './email-parser.ts';
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
    
    // Get sync period from request body
    const body = await req.json().catch(() => ({}));
    const syncPeriod = body.period || 7; // Default to 7 days if not specified
    console.log(`Sync period: ${syncPeriod} days`);
    
    // Validate user (pass body for service role detection)
    const user = await validateUser(req.headers.get('Authorization'), body);
    
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

    // Get existing leads to avoid duplicates
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('gmail_message_id, sender_email, subject, user_id')
      .eq('user_id', user.id);

    const existingMessageIds = new Set(existingLeads?.map(lead => lead.gmail_message_id) || []);
    
    console.log(`Found ${existingMessageIds.size} existing leads for current user`);

    // Get user's email address to exclude their own messages
    let userEmail = user.email;
    try {
      const profileResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${googleToken}`,
        }
      });
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        userEmail = profile.emailAddress || user.email;
        console.log(`User's Gmail address: ${userEmail}`);
      }
    } catch (error) {
      console.error('Error fetching user Gmail profile:', error);
      console.log(`Falling back to auth email: ${userEmail}`);
    }

    // Fetch both incoming and sent emails
    const leads: LeadData[] = [];
    let totalProcessed = 0;
    let sentEmailsProcessed = 0;
    let skippedDuplicates = 0;
    let skippedPromotional = 0;
    let processedMessagesCount = 0;

    // 1. Fetch incoming emails (potential leads) with deterministic ordering
    console.log('Fetching incoming emails with deterministic ordering...');
    
    // Use a more inclusive query - only exclude very specific automated patterns
    // Don't exclude personal emails or potential leads
    const incomingQuery = `newer_than:${syncPeriod}d -from:mailer-daemon -from:postmaster`;
    const incomingData = await gmailClient.fetchMessageList(incomingQuery, 500); // Increased limit significantly
    console.log('Found incoming messages:', incomingData.messages?.length || 0);

    if (incomingData.messages && incomingData.messages.length > 0) {
      // Sort messages by ID for deterministic processing order
      const sortedMessages = incomingData.messages.sort((a, b) => a.id.localeCompare(b.id));
      console.log(`Processing ALL ${sortedMessages.length} incoming messages with AI classification...`);
      processedMessagesCount = sortedMessages.length;
      
      for (let i = 0; i < sortedMessages.length; i++) {
        const message = sortedMessages[i];
        try {
          console.log(`Processing incoming message ${i + 1}/${sortedMessages.length}: ${message.id}`);
          
          // Skip if we already have this message for the CURRENT user
          if (existingMessageIds.has(message.id)) {
            console.log(`Skipping duplicate message for current user: ${message.id}`);
            skippedDuplicates++;
            continue;
          }
          
          const messageData = await gmailClient.fetchMessage(message.id);
          const { senderEmail, subject } = extractEmailHeaders(messageData);
          
          console.log(`Processing email: ${subject} (from: ${senderEmail})`);

          // Skip emails from the user themselves (their own replies/sent emails)
          if (senderEmail.toLowerCase() === userEmail?.toLowerCase()) {
            console.log(`Skipping email from user themselves: ${senderEmail}`);
            continue;
          }

          // Enhanced automated email detection
          if (isAutomatedEmail(senderEmail) || isAutomatedSubject(subject)) {
            console.log(`Automated email detected, skipping: ${senderEmail} - ${subject}`);
            continue;
          }

          // Quick pre-check for obviously promotional emails to save API costs
          if (isObviouslyPromotional(subject, senderEmail)) {
            console.log(`Obviously promotional email detected, skipping: ${subject}`);
            skippedPromotional++;
            continue;
          }

          // Additional business context filtering
          if (!hasBusinessRelevance(subject, senderEmail)) {
            console.log(`No business relevance detected, skipping: ${subject}`);
            skippedPromotional++;
            continue;
          }

          const body = extractEmailBody(messageData);
          
          // Detect urgency level
          const urgency = detectUrgencyLevel(subject, body);
          console.log(`Urgency detection: ${urgency.level} - indicators: ${urgency.indicators.join(', ')}`);
          
          console.log(`Analyzing email with AI: ${senderEmail} - ${subject}`);
          
          const aiResult = await classifyEmailWithAI(subject, body, senderEmail);
          console.log(`AI Classification: isLead=${aiResult.isLead}, classification=${aiResult.classification}, confidence=${aiResult.confidence}`);
          
          // Override classification if high urgency is detected but AI classified as cold
          if (urgency.level === 'high' && aiResult.isLead && aiResult.classification === 'cold') {
            console.log(`⚠️ Overriding cold classification due to high urgency indicators`);
            aiResult.classification = 'hot';
            aiResult.reasoning += ' (Upgraded to HOT due to urgency indicators)';
          }
          
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
            full_content: body, // Include the full email content
            received_at: new Date(parseInt(messageData.internalDate)).toISOString(),
            status: aiResult.classification,
            notes: `AI Classification: ${aiResult.reasoning} (Confidence: ${aiResult.confidence}%) | Urgency: ${urgency.level}${urgency.indicators.length > 0 ? ' (' + urgency.indicators.join(', ') + ')' : ''}`
          };

          leads.push(lead);
          totalProcessed++;

        } catch (error) {
          console.error(`Error processing incoming message ${message.id}:`, error);
        }
      }
    }

    // 2. Fetch sent emails to track responses with deterministic ordering
    console.log('Fetching sent emails to track responses...');
    const sentQuery = `in:sent newer_than:${syncPeriod}d`;
    const sentData = await gmailClient.fetchMessageList(sentQuery, 100); // Increased limit
    console.log('Found sent messages:', sentData.messages?.length || 0);

    if (sentData.messages && sentData.messages.length > 0) {
      // Sort sent messages by ID for deterministic processing
      const sortedSentMessages = sentData.messages.sort((a, b) => a.id.localeCompare(b.id));
      
      console.log(`Processing ${sortedSentMessages.length} sent messages to track responses...`);
      
      for (const message of sortedSentMessages) {
        try {
          const messageData = await gmailClient.fetchMessage(message.id);
          const { senderEmail: recipientEmail, subject } = extractEmailHeaders(messageData);
          
          // Enhanced matching logic for responses
          const matchingLead = existingLeads?.find(lead => {
            const emailMatch = lead.sender_email.toLowerCase() === recipientEmail.toLowerCase();
            const subjectMatch = isReplyToSubject(subject, lead.subject || '');
            return emailMatch && subjectMatch;
          });

          if (matchingLead) {
            console.log(`✓ Found response to lead: ${recipientEmail} - ${subject}`);
            
            // Update the lead to mark it as answered
            const { error: updateError } = await supabase
              .from('leads')
              .update({ 
                answered: true,
                responded_at: new Date(parseInt(messageData.internalDate)).toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('gmail_message_id', matchingLead.gmail_message_id)
              .eq('user_id', user.id);

            if (updateError) {
              console.error('Error updating lead response status:', updateError);
            } else {
              console.log(`✓ Marked lead ${matchingLead.gmail_message_id} as answered`);
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
    let insertedLeads: any[] = [];
    if (leads.length > 0) {
      console.log(`Inserting ${leads.length} new leads...`);
      
      const { data: insertData, error: insertError } = await supabase
        .from('leads')
        .insert(leads)
        .select();

      if (insertError) {
        console.error('Error inserting leads:', insertError);
        throw new Error(`Failed to save leads: ${insertError.message}`);
      } else {
        insertedLeads = insertData || [];
        console.log('✓ Successfully inserted AI-classified leads:', insertedLeads.length);
      }
    }

    const result = { 
      message: 'Gmail sync completed successfully', 
      new_leads: leads.length,
      new_leads_data: insertedLeads, // Return the actual new leads
      responses_tracked: sentEmailsProcessed,
      total_processed: totalProcessed,
      skipped_duplicates: skippedDuplicates,
      skipped_promotional: skippedPromotional,
      incoming_found: incomingData.messages?.length || 0,
      sent_found: sentData.messages?.length || 0,
      sync_timestamp: new Date().toISOString(),
      sync_parameters: {
        timeframe: `${syncPeriod} days`,
        incoming_query: incomingQuery,
        sent_query: sentQuery,
        max_incoming_processed: processedMessagesCount,
        max_sent_processed: 100
      }
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

// Helper function to detect automated subjects
function isAutomatedSubject(subject: string): boolean {
  const automatedPatterns = [
    /^(re:|fwd:|fw:)?\s*(unsubscribe|newsletter|notification|alert|reminder|receipt|invoice|confirmation)/i,
    /^(re:|fwd:|fw:)?\s*(no.?reply|do.?not.?reply|automated|system)/i,
    /^(re:|fwd:|fw:)?\s*(delivery|bounce|failure|error|warning)/i
  ];
  
  return automatedPatterns.some(pattern => pattern.test(subject));
}

// Quick pre-check for obviously promotional emails to save API costs
function isObviouslyPromotional(subject: string, senderEmail: string): boolean {
  const lowerSubject = subject.toLowerCase();
  const lowerEmail = senderEmail.toLowerCase();
  
  // FOCUSED PROMOTIONAL EMAIL DETECTION - Only block obvious spam
  
  // 1. DEFINITE SPAM SENDER PATTERNS (Only the most obvious ones)
  const spamSenderPatterns = [
    // No-reply addresses (automated)
    'noreply@', 'no-reply@', 'donotreply@', 'do-not-reply@',
    
    // Marketing/promotional addresses (clear spam)
    'newsletter@', 'marketing@', 'promo@', 'promotions@', 'deals@',
    'offers@', 'updates@', 'notifications@',
    
    // Email service providers (automated)
    '.mailchimp.', '.constantcontact.', '.sendgrid.', '.mailgun.',
    'amazonses.com',
    
    // Specific spam domains from your examples
    'aliexpress.com', 'ebay.', 'amazon.', 'calendly.com',
    'welcometothejungle.com', 'the5ers.com', 'praktika.ai'
  ];
  
  // 2. DEFINITE SPAM SUBJECT PATTERNS (Only obvious promotional/spam)
  const spamSubjectPatterns = [
    // Specific patterns from your spam examples
    /deleted \d{4}-\d{2}-\d{2}/i, // "Deleted 2025-07-06"
    /upgrade your ride/i,
    /transform your ride/i,
    /your ride awaits/i,
    /special tariffs/i,
    /new match:/i,
    /we fixed the bugs/i,
    /live scalping/i,
    /save big on/i,
    /emerging brands/i,
    /coveted collectibles/i,
    
    // Clear promotional language
    /newsletter/i,
    /unsubscribe/i,
    /% off/i,
    /free shipping/i,
    /black friday/i,
    /cyber monday/i,
    /flash sale/i,
    /limited time offer/i,
    /act now/i,
    /buy now/i,
    /shop now/i,
    
    // Job postings (not business inquiries)
    /job opportunity/i,
    /career opportunity/i,
    /we're hiring/i,
    /job opening/i,
    /developer position/i,
    /software engineer.*position/i,
    
    // Investment/trading spam
    /forex trading/i,
    /crypto trading/i,
    /make money online/i,
    /passive income/i,
    /investment opportunity/i
  ];
  
  // Check sender patterns
  for (const pattern of spamSenderPatterns) {
    if (lowerEmail.includes(pattern)) {
      return true;
    }
  }
  
  // Check subject patterns
  for (const pattern of spamSubjectPatterns) {
    if (pattern.test(lowerSubject)) {
      return true;
    }
  }
  
  return false;
}

// Helper function to check if a subject is a reply to another subject
function isReplyToSubject(sentSubject: string, originalSubject: string): boolean {
  const cleanSentSubject = sentSubject.toLowerCase().replace(/^(re:|fwd:|fw:)\s*/i, '').trim();
  const cleanOriginalSubject = originalSubject.toLowerCase().trim();
  
  // Check if sent subject contains original subject or vice versa
  return cleanSentSubject.includes(cleanOriginalSubject) || 
         cleanOriginalSubject.includes(cleanSentSubject) ||
         sentSubject.toLowerCase().includes('re:');
}

// Additional business relevance check - MUCH MORE PERMISSIVE
function hasBusinessRelevance(subject: string, senderEmail: string): boolean {
  const lowerSubject = subject.toLowerCase();
  const lowerEmail = senderEmail.toLowerCase();
  
  // Only block DEFINITIVE spam patterns - be very conservative
  const definiteSpamPatterns = [
    // Only the most obvious spam from your examples
    /deleted\s+\d{4}-\d{2}-\d{2}/i,
    /upgrade\s+your\s+ride/i,
    /transform\s+your\s+ride/i,
    /special\s+tariffs/i,
    /new\s+match:/i,
    /we\s+fixed\s+the\s+bugs/i,
    /live\s+scalping/i,
    /save\s+big\s+on/i,
    /emerging\s+brands/i,
    /coveted\s+collectibles/i,
    
    // Clear promotional newsletters
    /newsletter/i,
    /unsubscribe/i,
    
    // Obvious job spam
    /job\s+(opportunity|opening|alert)/i,
    /career\s+opportunity/i,
    /we're\s+hiring/i,
    /developer\s+position/i,
    
    // Obvious trading/investment spam
    /forex\s+trading/i,
    /crypto\s+trading/i,
    /make\s+money\s+online/i,
    /passive\s+income/i,
    /investment\s+opportunity/i,
    
    // Obvious shopping spam
    /flash\s+sale/i,
    /black\s+friday/i,
    /cyber\s+monday/i,
    /free\s+shipping/i,
    /buy\s+now/i,
    /shop\s+now/i
  ];
  
  // Only block if it matches definitive spam patterns
  for (const pattern of definiteSpamPatterns) {
    if (pattern.test(lowerSubject)) {
      return false;
    }
  }
  
  // Default to TRUE - let most emails through to AI classification
  // The AI classifier will do the heavy lifting
  return true;
}

serve(handler);
