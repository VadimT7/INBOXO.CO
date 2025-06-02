
import { GmailMessage } from './types.ts';

export function extractEmailBody(messageData: GmailMessage): string {
  let bodyText = '';
  
  // Try to get the body from the main payload
  if (messageData.payload.body?.data) {
    try {
      bodyText = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (e) {
      console.error('Error decoding body data:', e);
    }
  }
  
  // If no body in main payload, check parts
  if (!bodyText && messageData.payload.parts) {
    for (const part of messageData.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        try {
          bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          break;
        } catch (e) {
          console.error('Error decoding part data:', e);
        }
      }
    }
  }
  
  // Fallback to snippet if no body found
  if (!bodyText) {
    bodyText = messageData.snippet || '';
  }
  
  // Clean up the text (remove HTML tags, extra whitespace)
  return bodyText.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function extractEmailHeaders(messageData: GmailMessage) {
  const headers = messageData.payload.headers;
  const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
  const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');

  if (!fromHeader) {
    throw new Error('No from header found');
  }

  // Extract email address from "Name <email@domain.com>" format
  const emailMatch = fromHeader.value.match(/<([^>]+)>/) || [null, fromHeader.value];
  const senderEmail = (emailMatch[1] || fromHeader.value).trim();

  return {
    senderEmail,
    subject: subjectHeader?.value || ''
  };
}

export function isAutomatedEmail(senderEmail: string): boolean {
  return !senderEmail.includes('@') || 
         senderEmail.toLowerCase().includes('noreply') || 
         senderEmail.toLowerCase().includes('no-reply') ||
         senderEmail.toLowerCase().includes('donotreply') ||
         senderEmail.toLowerCase().includes('notification') ||
         senderEmail.toLowerCase().includes('automated');
}
