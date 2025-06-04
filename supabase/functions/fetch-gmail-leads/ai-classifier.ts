import { AIClassificationResult } from './types.ts';

// Function to detect promotional/solicitation emails with high confidence
function detectPromotionalEmail(subject: string, body: string, senderEmail: string): boolean {
  const normalizedSubject = subject.toLowerCase();
  const normalizedBody = body.toLowerCase();
  const normalizedEmail = senderEmail.toLowerCase();
  
  // Strong promotional indicators - these are very confident signals
  const strongPromotionalPatterns = [
    // Email structure patterns
    'unsubscribe', 'opt out', 'remove me', 'marketing@', 'promo@', 'offers@',
    'newsletter@', 'info@', 'support@', 'hello@', 'team@',
    
    // Promotional language patterns
    'limited time', 'act now', 'don\'t miss', 'exclusive offer', 'special deal',
    'free trial', 'get started', 'sign up now', 'join now', 'register now',
    'claim your', 'unlock', 'boost your', 'transform your', 'revolutionize',
    'step 1:', 'step 2:', 'step 3:', 'just 5 steps', 'in just', 'only takes',
    
    // Marketing call-to-actions
    'click here', 'learn more', 'get started', 'try it now', 'download now',
    'view online', 'read more', 'see full', 'browse our', 'check out',
    
    // Product promotion patterns
    'embed your', 'upload your', 'customize it', 'add engagement tools',
    'choose your', 'turning views into leads', 'brand new month',
    'boldest move', 'get paid instantly', 'pass your challenge',
    
    // Generic promotional phrases
    'if you miss this', 'don\'t blame us', 'as of today', 'that means:',
    'no more waiting', 'instant access', 'immediate results'
  ];
  
  // Sender domain patterns that are typically promotional
  const promotionalDomains = [
    'mailchimp', 'constantcontact', 'sendgrid', 'mailgun', 'campaignmonitor',
    'awsses', 'amazonses', 'mandrill', 'sparkpost', 'postmark',
    'intercom-mail', 'customerio', 'mixpanel', 'segment'
  ];
  
  // Check for promotional domains
  for (const domain of promotionalDomains) {
    if (normalizedEmail.includes(domain)) {
      console.log(`Promotional domain detected: ${domain} in ${senderEmail}`);
      return true;
    }
  }
  
  // Count promotional patterns in subject and body
  let promotionalScore = 0;
  
  for (const pattern of strongPromotionalPatterns) {
    if (normalizedSubject.includes(pattern)) {
      promotionalScore += 2; // Subject matches weighted higher
    }
    if (normalizedBody.includes(pattern)) {
      promotionalScore += 1;
    }
  }
  
  // Check for step-by-step instructions pattern (very common in promotional emails)
  const stepPattern = /step \d+:/gi;
  const stepMatches = (normalizedSubject + ' ' + normalizedBody).match(stepPattern);
  if (stepMatches && stepMatches.length >= 3) {
    console.log(`Step-by-step promotional pattern detected: ${stepMatches.length} steps`);
    promotionalScore += 3;
  }
  
  // Check for numbered list patterns
  const numberedListPattern = /\d+[:.]\s+[A-Z]/g;
  const numberedMatches = body.match(numberedListPattern);
  if (numberedMatches && numberedMatches.length >= 3) {
    console.log(`Numbered list promotional pattern detected: ${numberedMatches.length} items`);
    promotionalScore += 2;
  }
  
  // Check for HTML-like content (❌ ✅ emojis in structured format)
  const emojiListPattern = /[❌✅🔥💪⭐🚀📧🎬🌤️❄️]\s+/g;
  const emojiMatches = body.match(emojiListPattern);
  if (emojiMatches && emojiMatches.length >= 2) {
    console.log(`Emoji list promotional pattern detected: ${emojiMatches.length} emoji bullets`);
    promotionalScore += 2;
  }
  
  const isPromotional = promotionalScore >= 3;
  
  if (isPromotional) {
    console.log(`Promotional email detected with score ${promotionalScore}: ${subject}`);
  }
  
  return isPromotional;
}

// Function to detect leads based on keywords when AI fails
function detectLeadByKeywords(subject: string, body: string): boolean {
  const leadKeywords = [
    'urgent', 'quote', 'buy now', 'purchase', 'interested', 'price', 'cost',
    'inquiry', 'enquiry', 'proposal', 'service', 'budget', 'lead', 'request',
    'opportunity', 'project', 'consultation', 'estimate', 'pricing'
  ];
  
  const normalizedSubject = subject.toLowerCase();
  const normalizedBody = body.toLowerCase();
  
  // Check for keywords in subject (weighted more heavily)
  for (const keyword of leadKeywords) {
    if (normalizedSubject.includes(keyword)) {
      console.log(`Lead keyword detected in subject: ${keyword}`);
      return true;
    }
  }
  
  // Check combinations of keywords in body
  let keywordMatches = 0;
  for (const keyword of leadKeywords) {
    if (normalizedBody.includes(keyword)) {
      keywordMatches++;
      if (keywordMatches >= 2) {
        console.log(`Multiple lead keywords detected in body: ${keywordMatches} matches`);
        return true;
      }
    }
  }
  
  return false;
}

export async function classifyEmailWithAI(subject: string, body: string, senderEmail: string): Promise<AIClassificationResult> {
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

  // First, check if this is clearly a promotional email using our pattern detection
  const isPromotional = detectPromotionalEmail(subject, body, senderEmail);
  if (isPromotional) {
    console.log(`Confidently excluding promotional email: ${subject}`);
    return {
      isLead: false,
      classification: 'unclassified',
      confidence: 95,
      reasoning: 'Promotional/solicitation email detected - contains marketing patterns, step-by-step instructions, or promotional language'
    };
  }

  const prompt = `Analyze this email to determine if it's a potential business lead and classify it. 

Email Details:
- From: ${senderEmail}
- Subject: ${subject}
- Body: ${body.substring(0, 1000)} ${body.length > 1000 ? '...' : ''}

Please analyze this email and respond with a JSON object containing:
1. "isLead" (boolean): true if this appears to be a business inquiry/lead
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

IMPORTANT - CONFIDENTLY EXCLUDE these types of emails (set isLead: false):
- Marketing emails with step-by-step instructions (e.g., "Step 1: Upload your video")
- Promotional emails with calls-to-action like "Get started", "Sign up now", "Try it now"
- Newsletters and product announcements
- Emails with promotional language like "Limited time", "Don't miss", "Exclusive offer"
- Mass marketing emails with unsubscribe links or marketing domains
- Emails that sound like they're trying to sell YOU something rather than inquiring about YOUR services
- Generic promotional content with emoji lists (❌ ✅) or numbered instructions
- Automated marketing sequences or drip campaigns

Focus on identifying genuine business inquiries where someone is asking about YOUR services, not trying to sell you theirs.

Some leads may seem as spam because of a low or shortened level of English used, but still include them in as leads, with the exception of promotional emails as described above.

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
            content: 'You are an expert at analyzing business emails to identify and classify potential leads. You are particularly skilled at distinguishing between genuine business inquiries and promotional/marketing emails. Always respond with valid JSON only.'
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
      
      // If AI says it's not a lead, try our keyword fallback, but ONLY if it's not promotional
      if (!result.isLead) {
        const keywordDetection = detectLeadByKeywords(subject, body);
        if (keywordDetection && !isPromotional) {
          console.log(`AI classified as non-lead but keyword detection overrode: ${subject}`);
          return {
            isLead: true,
            classification: 'warm',
            confidence: 70,
            reasoning: 'Keyword-based detection identified potential lead signals in the email'
          };
        }
      }
      
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
    
    // If OpenAI fails, fall back to keyword detection, but ONLY if it's not promotional
    const keywordDetection = detectLeadByKeywords(subject, body);
    if (keywordDetection && !isPromotional) {
      console.log(`OpenAI API failed but keyword detection identified lead: ${subject}`);
      return {
        isLead: true,
        classification: 'warm',
        confidence: 60,
        reasoning: 'Keyword-based detection identified potential lead signals when AI was unavailable'
      };
    }
    
    return {
      isLead: false,
      classification: 'unclassified',
      confidence: 0,
      reasoning: 'OpenAI API call failed'
    };
  }
}