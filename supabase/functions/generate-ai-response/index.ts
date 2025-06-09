import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request payload
    const { 
      emailContent, 
      emailSubject, 
      senderEmail,
      tone, 
      length,
      writingStyle,
      similarResponses 
    } = await req.json()

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OpenAI API key not configured')
      throw new Error('AI service not configured. Please contact support.')
    }

    // Get user's business context and profile from settings
    const { data: settingsData } = await supabaseClient
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    const settings = settingsData?.settings || {}
    const businessContext = settings.businessContext || {}
    const userFullName = settings.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    // Build the comprehensive prompt
    const systemPrompt = `You are an AI email assistant that generates professional, personalized email responses for a business. Your goal is to convert leads into customers by providing helpful, relevant information that addresses their needs while showcasing the business value.

USER'S BUSINESS CONTEXT:
${businessContext.companyName ? `Company: ${businessContext.companyName}` : ''}
${businessContext.industry ? `Industry: ${businessContext.industry}` : ''}
${businessContext.description ? `Business Description: ${businessContext.description}` : ''}

SERVICES/PRODUCTS:
${businessContext.services?.length > 0 ? businessContext.services.map((service: any) => `- ${service.name}: ${service.description} (${service.price})`).join('\n') : 'No specific services listed'}

PRICING PLANS:
${businessContext.pricingPlans?.length > 0 ? businessContext.pricingPlans.map((plan: any) => {
  const features = plan.features && plan.features.length > 0 ? plan.features.join(', ') : 'Standard features included';
  const description = plan.description || 'Perfect for your needs';
  return `- ${plan.name}: $${plan.price}/${plan.billing} - ${description}\n  Features: ${features}`;
}).join('\n') : 'No pricing plans listed'}

UNIQUE VALUE PROPOSITIONS:
${businessContext.valuePropositions?.length > 0 ? businessContext.valuePropositions.join('\n- ') : 'No specific value propositions listed'}

TARGET AUDIENCE:
${businessContext.targetAudience ? businessContext.targetAudience : 'General business audience'}

WRITING STYLE PREFERENCES:
- Preferred tone: ${writingStyle?.preferred_tone || tone}
- Preferred length: ${writingStyle?.preferred_length || length}
- Your name (for signature): ${userFullName}
- Signature: ${writingStyle?.signature || userFullName}
${writingStyle?.custom_phrases?.length > 0 ? `- Custom phrases to incorporate: ${writingStyle.custom_phrases.join(', ')}` : ''}

RESPONSE REQUIREMENTS:
- Tone: ${tone} (professional/friendly/casual)
- Length: ${length} (short: 50-75 words, medium: 100-150 words, detailed: 200+ words)
- Generate ONLY the email body content - NO subject line
- Do NOT include any subject line, headers, or "Re:" prefixes
- Start directly with the greeting/opening of the email
- Always include a clear call-to-action
- Reference specific services/pricing when relevant to the inquiry
- Highlight unique value propositions when appropriate
- Be conversational and helpful, not salesy
- Address the sender's specific needs or questions
- Include next steps or ways to continue the conversation
- ALWAYS end with YOUR name: "Best regards, ${userFullName}" or "Best, ${userFullName}" or similar
- Use the CUSTOMER'S name (extract from email sender or content) for personalization throughout the response`

    const userPrompt = `Generate a ${tone} email response (${length} length) to this email:

From: ${senderEmail}
Subject: ${emailSubject}
Content: ${emailContent}

${similarResponses?.length > 0 ? `\nFor context, here are similar responses the user has sent before:\n${similarResponses.map((r: any) => `- ${r.generated_response}`).join('\n')}` : ''}

CRITICAL INSTRUCTION: Generate ONLY the email body content. Do NOT include any subject line or "Re:" prefixes.

INSTRUCTIONS:
1. Analyze the email content to understand what the sender is looking for
2. If they're asking about pricing, services, or solutions, reference the specific business context above
3. If they mention budget constraints, suggest the most appropriate pricing plan
4. If they're asking general questions, provide helpful information while subtly introducing relevant services
5. Always end with a clear next step (schedule a call, request more info, etc.)
6. Keep the ${tone} tone throughout
7. Use the business context to provide specific, relevant value
8. Don't be overly promotional - focus on being helpful first
9. Use the customer's name (from ${senderEmail} or email content) for personalization throughout
10. MUST end the email with "Best regards, ${userFullName}" or "Best, ${userFullName}"
11. IMPORTANT: Start directly with "Dear [Name]," or "Hi [Name]," - NO subject line before that

Generate a response that converts this lead by being genuinely helpful and relevant to their needs.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: length === 'short' ? 200 : length === 'medium' ? 350 : 500,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate AI response')
    }

    const aiData = await openaiResponse.json()
    const generatedResponse = aiData.choices[0]?.message?.content

    if (!generatedResponse) {
      throw new Error('No response generated')
    }

    // Track usage
    await supabaseClient.rpc('increment_user_usage', {
      p_user_id: user.id,
      p_ai_responses_delta: 1
    })

    return new Response(
      JSON.stringify({ 
        response: generatedResponse,
        model: 'gpt-4-turbo-preview',
        tokensUsed: aiData.usage?.total_tokens || 0
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in generate-ai-response:', error.message)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: error.message === 'Unauthorized' ? 401 : 500,
      }
    )
  }
}) 