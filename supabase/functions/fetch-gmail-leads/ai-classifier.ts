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

  const prompt = `You are a business lead classifier. Classify emails as leads if they show genuine business interest or inquiries.

Email to analyze:
From: ${senderEmail}
Subject: ${subject}
Body: ${body}

CLASSIFICATION CRITERIA:

🔥 HOT LEAD:
- Urgent requests with specific needs
- Budget mentioned or immediate timeline
- Clear project requirements
- Ready to proceed language
- Examples: "URGENT: Need website, $5000 budget", "Can you start this week?"

🔥 WARM LEAD:
- Clear business inquiry or interest
- Asking for quotes, pricing, or information
- Specific service needs mentioned
- Professional tone from potential customer
- Examples: "Looking for web developer", "Need help with marketing", "What are your rates?"

❄️ COLD LEAD:
- General interest or information gathering
- Vague inquiries without specific needs
- May be researching for future use
- Examples: "What services do you offer?", "Tell me about your company"

🚫 NOT A LEAD:
- Promotional emails or newsletters
- Job postings or recruitment
- Product sales emails (selling TO you)
- Automated notifications
- Investment/trading promotions
- Shopping/e-commerce promotions
- Social media notifications

IMPORTANT GUIDELINES:
- Focus on INTENT: Are they asking for services or showing business interest?
- Be REASONABLE: Don't require perfect business language - real customers write casually
- Consider CONTEXT: Personal emails from individuals can be legitimate leads
- When UNCERTAIN: Classify as a lead if there's any reasonable business intent

Respond with ONLY this JSON format:
{"isLead": boolean, "classification": "hot"|"warm"|"cold"|"unclassified", "confidence": 0-100, "reasoning": "brief explanation"}

Be thorough but not overly strict. Real business inquiries come in many forms.`;

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
            content: 'You are a business lead classifier. Your goal is to identify genuine business inquiries while filtering out obvious spam. Be reasonable and not overly strict - real customers often write casual emails. Focus on business intent rather than perfect language.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Balanced temperature for consistency
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
      
      // More reasonable validation - lower confidence threshold
      const confidence = Number(result.confidence) || 0;
      const isLead = Boolean(result.isLead);
      
      // Only reject if confidence is very low (50% instead of 70%)
      if (isLead && confidence < 50) {
        console.log(`⚠️ AI classified as lead but confidence too low (${confidence}%), marking as not a lead`);
        return {
          isLead: false,
          classification: 'unclassified',
          confidence: confidence,
          reasoning: `${result.reasoning} (Rejected: confidence too low)`
        };
      }
      
      return {
        isLead: isLead,
        classification: result.classification || 'unclassified',
        confidence: confidence,
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