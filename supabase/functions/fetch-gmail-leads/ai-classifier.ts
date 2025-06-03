
import { AIClassificationResult } from './types.ts';

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

Exclude newsletters, automated emails, notifications.

Some leads could seem as spam, but still include them in.

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
            content: 'You are an expert at analyzing business emails to identify and classify potential leads. Always respond with valid JSON only.'
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
      
      // If AI says it's not a lead, try our keyword fallback
      if (!result.isLead) {
        const keywordDetection = detectLeadByKeywords(subject, body);
        if (keywordDetection) {
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
    
    // If OpenAI fails, fall back to keyword detection
    const keywordDetection = detectLeadByKeywords(subject, body);
    if (keywordDetection) {
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
