import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-google-token',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Send Email Reply Function Started ===');
    
    // Helper function to format email body for better display
    const formatEmailBody = (body: string): string => {
      // First, normalize all line endings to \n
      let formatted = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // Remove any existing excessive whitespace and normalize
      formatted = formatted.trim();
      
      // Split into paragraphs (double line breaks or more)
      const paragraphs = formatted.split(/\n\s*\n/);
      
      // Process each paragraph
      const processedParagraphs = paragraphs.map(paragraph => {
        // Remove line breaks within paragraphs unless they're intentional (after punctuation)
        let processed = paragraph
          // Remove line breaks that split words or sentences inappropriately
          .replace(/([a-z,])\s*\n\s*([a-z])/gi, '$1 $2')
          // Remove line breaks before punctuation
          .replace(/\s*\n\s*([.!?:;,])/g, '$1')
          // Clean up multiple spaces
          .replace(/\s+/g, ' ')
          // Trim the paragraph
          .trim();
        
        return processed;
      }).filter(p => p.length > 0);
      
      // Join paragraphs with double line breaks
      return processedParagraphs.join('\n\n');
    };

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get request body first to check for user_id
    const requestBody = await req.json();
    const { leadId, recipientEmail, subject, body, user_id } = requestBody;

    // Verify user - handle both regular auth and service role contexts
    let user: any;
    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is a service role call with user_id in body
    if (token === supabaseServiceKey && user_id) {
      console.log('Service role context detected, using provided user_id:', user_id);
      // When called with service role, get user data from profiles table
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', user_id)
        .single();
        
      if (profileFetchError || !profileData) {
        console.error('Profile fetch error:', profileFetchError);
        throw new Error('Invalid user_id provided');
      }
      
      // Create a user object compatible with auth user format
      user = {
        id: profileData.id,
        email: null // We'll get this from Gmail API later
      };
    } else {
      // Regular user auth flow
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !authUser) {
        throw new Error('Unauthorized');
      }
      
      user = authUser;
    }

    // Get Google access token from header
    const googleToken = req.headers.get('X-Google-Token');
    if (!googleToken) {
      throw new Error('No Google access token provided. Please sign out and sign in again with Google to enable email sending.');
    }

    if (!recipientEmail || !subject || !body) {
      throw new Error('Missing required fields: recipientEmail, subject, or body');
    }

    // Format the email body for better display
    const formattedBody = formatEmailBody(body);
    
    console.log(`Sending email to ${recipientEmail} with subject: ${subject}`);

    // Get the original Gmail message ID from the lead to properly thread the reply
    let originalMessageId = null;
    let leadData: any = null;
    if (leadId) {
      const { data, error: leadError } = await supabase
        .from('leads')
        .select('gmail_message_id')
        .eq('id', leadId)
        .eq('user_id', user.id)
        .single();
      
      leadData = data;

      if (!leadError && leadData?.gmail_message_id) {
        originalMessageId = leadData.gmail_message_id;
        console.log(`Found original message ID: ${originalMessageId}`);

        // Get the original message to extract the Message-ID header
        try {
          const originalMessageResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${originalMessageId}?format=metadata&metadataHeaders=Message-ID`,
            {
              headers: {
                'Authorization': `Bearer ${googleToken}`,
              }
            }
          );

          if (originalMessageResponse.ok) {
            const originalMessage = await originalMessageResponse.json();
            const headers = originalMessage.payload?.headers || [];
            const messageIdHeader = headers.find((h: any) => h.name === 'Message-ID');
            if (messageIdHeader) {
              originalMessageId = messageIdHeader.value;
              console.log(`Found Message-ID header: ${originalMessageId}`);
            }
          }
        } catch (error) {
          console.error('Error fetching original message:', error);
        }
      }
    }

    // Get user's email address for the From header
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
        console.log(`Using email address: ${userEmail}`);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }

    // Create the email message in RFC 2822 format with proper threading headers
    const messageParts = [
      `From: ${userEmail}`,
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
    ];

    // Add threading headers if we have the original message ID
    if (originalMessageId) {
      messageParts.push(`In-Reply-To: ${originalMessageId}`);
      messageParts.push(`References: ${originalMessageId}`);
    }

    messageParts.push(''); // Empty line before body
    messageParts.push(formattedBody);

    const message = messageParts.join('\r\n');

    // Encode the message
    const encodedMessage = btoa(unescape(encodeURIComponent(message)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email using Gmail API
    const sendPayload: any = {
      raw: encodedMessage
    };

    // If we have the original message ID, add it as threadId for proper threading
    if (leadId && originalMessageId) {
      // Note: We need the thread ID, not the message ID. Let's get it.
      try {
        const threadResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${leadData.gmail_message_id}?format=minimal`,
          {
            headers: {
              'Authorization': `Bearer ${googleToken}`,
            }
          }
        );
        if (threadResponse.ok) {
          const threadData = await threadResponse.json();
          if (threadData.threadId) {
            sendPayload.threadId = threadData.threadId;
            console.log(`Using thread ID: ${threadData.threadId}`);
          }
        }
      } catch (error) {
        console.error('Error fetching thread ID:', error);
      }
    }

    console.log('Sending email with payload:', { ...sendPayload, raw: 'REDACTED' });

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendPayload)
    });

    console.log('Gmail API response status:', sendResponse.status);

    if (!sendResponse.ok) {
      const errorData = await sendResponse.text();
      console.error('Gmail API error:', sendResponse.status, errorData);
      
      // Check for specific error types
      if (sendResponse.status === 401) {
        throw new Error('Google access token is invalid or expired. Please sign out and sign in again.');
      } else if (sendResponse.status === 403) {
        throw new Error('Gmail API access denied. Please ensure you have granted email sending permissions.');
      } else if (sendResponse.status === 400) {
        throw new Error(`Invalid email format or content: ${errorData}`);
      } else {
        throw new Error(`Failed to send email: ${sendResponse.status} ${errorData}`);
      }
    }

    const sentMessage = await sendResponse.json();
    console.log('Email sent successfully:', sentMessage.id);

    // Update the lead to mark it as answered and auto-replied
    if (leadId) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          answered: true,
          auto_replied: true,
          responded_at: new Date().toISOString(),
          gmail_reply_id: sentMessage.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating lead status:', updateError);
        // Don't throw here - email was sent successfully
      } else {
        console.log(`✓ Lead ${leadId} marked as answered and auto-replied`);
      }

      // Track the sent email in profiles table
      const { error: usageError } = await supabase.rpc('increment_emails_sent', {
        user_id_param: user.id
      });

      if (usageError) {
        console.error('Error updating sent email count:', usageError);
      }
    }

    const result = {
      success: true,
      messageId: sentMessage.id,
      recipientEmail,
      subject
    };

    console.log('=== Function completed successfully ===', result);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('=== Error in send-email-reply function ===', error);
    
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