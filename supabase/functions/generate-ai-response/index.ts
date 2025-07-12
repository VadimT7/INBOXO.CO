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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get request body first to check for user_id
    const requestBody = await req.json();
    const { 
      emailContent, 
      emailSubject, 
      senderEmail,
      tone, 
      length,
      writingStyle,
      similarResponses,
      user_id 
    } = requestBody;

    // Verify user - handle both regular auth and service role contexts
    let user: any;
    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is a service role call with user_id in body
    if (token === supabaseServiceKey && user_id) {
      console.log('Service role context detected, using provided user_id:', user_id);
      // When called with service role, get user data from profiles table
      const { data: profileData, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user_id)
        .single();
        
      if (profileFetchError || !profileData) {
        console.log('Profile fetch error:', profileFetchError);
        throw new Error('Invalid user_id provided');
      }
      
      // Create a user object compatible with auth user format
      user = {
        id: profileData.id,
        email: null, // We don't need email for AI generation
        user_metadata: {}
      };
    } else {
      // Regular user auth flow
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (userError || !authUser) {
        throw new Error('Unauthorized');
      }
      
      user = authUser;
    }

    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      console.error('OpenAI API key not configured')
      throw new Error('AI service not configured. Please contact support.')
    }

    // Get user's business context and profile from settings
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    const settings = settingsData?.settings || {}
    const businessContext = settings.businessContext || {}
    const userFullName = settings.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    // Build the comprehensive prompt
    const systemPrompt = `You are an elite sales AI that generates high-converting email responses. Your goal is to CLOSE DEALS by being enthusiastic, direct, and action-oriented. You adapt your approach based on the prospect's intent and urgency level.

⚠️ CRITICAL BUSINESS RULES - YOU MUST FOLLOW THESE EXACTLY:
${businessContext.description ? `
BUSINESS DESCRIPTION AND POLICIES:
${businessContext.description}

IMPORTANT: The above description contains STRICT BUSINESS RULES that you MUST follow. These may include:
- Working hours/schedule
- What services/products we DO and DON'T offer
- Specific policies (e.g., no test drives, appointment requirements, pricing rules)
- Any restrictions or limitations

YOU MUST NEVER contradict or ignore these rules. If a customer asks for something we explicitly don't offer, politely explain our policy and suggest alternatives.` : ''}

USER'S BUSINESS CONTEXT:
${businessContext.companyName ? `Company: ${businessContext.companyName}` : ''}
${businessContext.industry ? `Industry: ${businessContext.industry}` : ''}

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

SALES APPROACH GUIDELINES:
1. **HOT LEADS** (showing clear buying intent): Use "Hell Yes!" energy. Be direct, assume the sale, push for immediate action.
2. **INTERESTED PROSPECTS**: Be enthusiastic but probe for pain points. Ask qualifying questions while showing how we solve their problems.
3. **INFORMATION SEEKERS**: Educate while creating urgency. Share value but always push for next steps.
4. **PRICE SHOPPERS**: Emphasize value over cost. Show ROI and what they're missing without us.
5. **SKEPTICAL PROSPECTS**: Use social proof, guarantees, and risk reversal. Be confident but not pushy.

RESPONSE REQUIREMENTS:
- Tone: ${tone} but ALWAYS confident and persuasive
- Length: ${length} (short: 50-75 words, medium: 100-150 words, detailed: 200+ words)
- Generate ONLY the email body content - NO subject line
- Start directly with the greeting/opening
- ALWAYS include a strong, specific call-to-action
- Create urgency without being desperate
- Use power words: "absolutely", "definitely", "excited", "perfect", "exactly"
- End with enthusiasm and YOUR name: "${userFullName}"
- Format for readability: short paragraphs, no excessive line breaks`

    const userPrompt = `Generate a HIGH-CONVERTING ${tone} email response (${length} length) to this email:

From: ${senderEmail}
Subject: ${emailSubject}
Content: ${emailContent}

${similarResponses?.length > 0 ? `\nFor context, here are similar responses the user has sent before:\n${similarResponses.map((r: any) => `- ${r.generated_response}`).join('\n')}` : ''}

⚠️ CRITICAL INSTRUCTIONS - READ FIRST:

1. BUSINESS RULES COMPLIANCE:
   - You MUST check the business description for any restrictions or policies
   - If the customer asks for something we DON'T offer (e.g., test drives if we don't offer them), you MUST politely decline and explain our policy
   - Never promise or suggest anything that contradicts our stated business rules
   - Always respect working hours, availability, and any other constraints mentioned
   
2. ANALYZE THE PROSPECT:
   - What's their intent level? (Just browsing vs ready to buy)
   - What's their urgency? (Need it now vs researching)
   - What's their main concern? (Price, features, trust, timing)
   - Are they asking for something we explicitly don't offer?
   
3. CHOOSE YOUR APPROACH:
   - If they mention budget/timeline/specific needs = BE AGGRESSIVE, push for a call TODAY
   - If they're comparing options = Show why we're THE BEST choice, create FOMO
   - If they're asking general questions = Educate but ALWAYS push for action
   - If they seem hesitant = Address concerns directly, use guarantees/social proof
   - If they're asking for something we don't offer = Politely explain our policy and offer alternatives

4. SALES TACTICS TO USE:
   - Name-drop successful clients (even if generic: "companies like yours")
   - Create scarcity ("spots filling up", "special pricing this week")
   - Use pattern interrupts ("I'll be honest with you...")
   - Ask for small commitments ("just 15 minutes", "quick demo")
   - Use assumptive language ("When we get started...", "Your success with us...")

5. FORMATTING RULES:
   - Use short, punchy paragraphs (2-3 sentences max)
   - Use line breaks between ideas for readability
   - Bold or emphasize key points with CAPS sparingly
   - End with a question or time-specific CTA
   - IMPORTANT: Use ONLY single line breaks between paragraphs, never multiple
   - Keep lines at reasonable length - let email clients handle word wrapping
   - CRITICAL: Write each paragraph as a single continuous line of text without internal line breaks
   - Only break lines between complete thoughts/paragraphs
   - Never break lines within sentences or phrases

6. MUST INCLUDE:
   - Personalized greeting using their name (extract from email/sender)
   - Reference their specific need/question
   - Connect their need to our solution (while respecting our business rules)
   - Create urgency or FOMO
   - Specific next step with timeline
   - Enthusiastic closing with "${userFullName}"

Remember: You're not just answering an email, you're CLOSING A DEAL. Be helpful but ALWAYS be closing. And NEVER violate our stated business rules or policies.

Generate a response that makes them WANT to take action NOW, while staying within our business constraints.`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: length === 'short' ? 200 : length === 'medium' ? 350 : 500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
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
    await supabase.rpc('increment_user_usage', {
      p_user_id: user.id,
      p_ai_responses_delta: 1
    })

    return new Response(
      JSON.stringify({ 
        response: generatedResponse,
        model: 'gpt-4o',
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