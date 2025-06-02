
import { GmailListResponse, GmailMessage } from './types.ts';

export class GmailClient {
  constructor(private accessToken: string) {}

  async validateToken(): Promise<boolean> {
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    return testResponse.ok;
  }

  async fetchMessageList(query: string, maxResults: number = 30): Promise<GmailListResponse> {
    const gmailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    console.log('Fetching from Gmail API:', gmailUrl);

    const listResponse = await fetch(gmailUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('Gmail API list error:', listResponse.status, errorText);
      
      if (listResponse.status === 401) {
        throw new Error('Google access token expired. Please sign out and sign in again with Google.');
      } else if (listResponse.status === 403) {
        throw new Error('Gmail API access denied. Please ensure Gmail permissions were granted during sign-in.');
      } else {
        throw new Error(`Gmail API error: ${listResponse.status}`);
      }
    }

    return await listResponse.json();
  }

  async fetchMessage(messageId: string): Promise<GmailMessage> {
    const messageResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!messageResponse.ok) {
      throw new Error(`Failed to fetch message ${messageId}: ${messageResponse.status}`);
    }

    return await messageResponse.json();
  }
}
