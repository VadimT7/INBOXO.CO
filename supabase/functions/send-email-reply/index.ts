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
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get Google access token from header
    const googleToken = req.headers.get('X-Google-Token');
    if (!googleToken) {
      throw new Error('No Google access token provided. Please sign out and sign in again with Google to enable email sending.');
    }

    // Get request body
    const { leadId, recipientEmail, subject, body } = await req.json();

    if (!recipientEmail || !subject || !body) {
      throw new Error('Missing required fields: recipientEmail, subject, or body');
    }

    console.log(`Sending email to ${recipientEmail} with subject: ${subject}`);

    // Create the email message in RFC 2822 format
    const messageParts = [
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ];
    const message = messageParts.join('\r\n');

    // Encode the message
    const encodedMessage = btoa(message)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email using Gmail API
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!sendResponse.ok) {
      const errorData = await sendResponse.text();
      console.error('Gmail API error:', sendResponse.status, errorData);
      throw new Error(`Failed to send email: ${sendResponse.status} ${errorData}`);
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