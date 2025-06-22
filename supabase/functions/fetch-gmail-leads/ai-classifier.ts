import { AIClassificationResult } from './types.ts';

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

  const prompt = `Analyze this email and determine if it's a genuine business inquiry asking for YOUR services.

Email:
From: ${senderEmail}
Subject: ${subject}
Body: ${body}

IMPORTANT CLASSIFICATION FACTORS:
1. URGENCY - Look for urgent language, time sensitivity, caps lock, exclamation marks
2. INTENT - Clear request for services, quotes, or information
3. BUDGET - Mentions of specific budget or price ranges
4. SPECIFICITY - Detailed requirements or specific questions
5. TONE - Professional inquiry vs promotional/spam

CLASSIFICATION RULES:
- HOT LEAD: Urgent requests, specific budgets mentioned, immediate needs, clear buying intent
- WARM LEAD: General inquiries with interest, asking for quotes, moderate urgency
- COLD LEAD: Vague interest, just gathering information, no urgency
- NOT A LEAD: Promotional emails, newsletters, trying to sell TO us

Examples of HOT LEADS:
- "URGENT: Need roof repair ASAP, budget $10,000"
- "Can you start this week? I need immediate help"
- "Ready to proceed with $5000 budget for your services"

Examples of WARM LEADS:
- "I'm interested in your services, can you send a quote?"
- "Looking to renovate next month, what are your rates?"
- "Please provide pricing for your landscaping services"

Examples of COLD LEADS:
- "Just browsing your services for future reference"
- "Might need this someday, what do you offer?"
- "Gathering information for next year's project"

Examples of NON-LEADS:
- Marketing emails, newsletters, promotions
- Emails trying to sell services TO you
- Automated notifications or system emails

Respond with ONLY this JSON format:
{"isLead": boolean, "classification": "hot"|"warm"|"cold"|"unclassified", "confidence": 0-100, "reasoning": "brief explanation"}`;

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
            content: 'You are an expert at identifying and classifying business leads. Pay special attention to URGENCY indicators like "URGENT", "ASAP", caps lock, time sensitivity, and immediate needs. These should typically be classified as HOT leads if they show genuine interest. A lead with clear intent and urgency should NEVER be classified as cold.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
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
    let aiResponse = data.choices[0].message.content;
    
    console.log('AI Response:', aiResponse);
    
    try {
      // Strip any markdown formatting if present
      aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
      
      const result = JSON.parse(aiResponse);
      
      return {
        isLead: Boolean(result.isLead),
        classification: result.classification || 'unclassified',
        confidence: Number(result.confidence) || 0,
        reasoning: result.reasoning || 'AI classification'
      };
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
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