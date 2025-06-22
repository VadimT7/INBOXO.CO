export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
    body?: {
      data?: string;
    };
  };
}

export interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
}

export interface AIClassificationResult {
  isLead: boolean;
  classification: 'hot' | 'warm' | 'cold' | 'unclassified';
  confidence: number;
  reasoning: string;
}

export interface LeadData {
  user_id: string;
  gmail_message_id: string;
  sender_email: string;
  subject: string;
  snippet: string;
  full_content?: string;
  received_at: string;
  status: string;
  notes: string;
}
