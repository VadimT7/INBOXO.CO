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

Is this email someone asking for a quote, service, or information about YOUR business?
Or is it a promotional/marketing email trying to sell something TO you?

Examples of LEADS (mark as isLead: true):
- "Hi, what are your options for roof installation? 20M^2 of surface and metallic?"
- "I am looking to renovate my roof for 10000 USD for 55 square meters"
- "Can you provide a quote for plumbing services?"
- "What's your pricing for landscaping?"

Examples of NON-LEADS (mark as isLead: false):
- "2 Years of OpusClip. Big updates. Bigger giveaways"
- "Get 20% off NHL gear"
- "Your Shopify trial for $1"
- Any newsletter, promotion, or marketing email

Respond with ONLY this JSON format:
{"isLead": boolean, "classification": "hot"|"warm"|"cold"|"unclassified", "confidence": 0-100}`;

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
            content: 'You are an expert at identifying genuine business inquiries. Be very strict - only mark emails as leads if someone is clearly asking for services or quotes. Marketing emails, newsletters, and promotions are NEVER leads.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 150
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