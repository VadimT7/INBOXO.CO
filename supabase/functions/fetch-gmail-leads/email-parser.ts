
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
  // Only check for obviously invalid email formats or very specific system domains
  // Don't filter out potential leads based on common keywords
  
  if (!senderEmail.includes('@')) {
    return true; // Not a valid email address
  }
  
  // Create a list of specific system domains that are definitely automated
  const systemDomains = [
    'mailchimp.com',
    'sendgrid.net',
    'amazonses.com',
    'mailgun.org',
    'postmaster.',
    'mailer-daemon'
  ];
  
  const lowerEmail = senderEmail.toLowerCase();
  
  // Check against system domains
  for (const domain of systemDomains) {
    if (lowerEmail.includes(domain)) {
      return true;
    }
  }
  
  // Don't filter out based on common patterns anymore
  // This allows emails with noreply@company.com or similar to be evaluated by our lead detection
  
  return false;
}
