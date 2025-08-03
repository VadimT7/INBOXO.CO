# Auto-Reply Feature Documentation

## Overview
The auto-reply feature in Inboxo automatically generates and sends personalized email responses to your leads using AI. When enabled, it helps you respond quickly to hot and warm leads, ensuring no opportunity is missed.

## How It Works

### 1. **Automatic Lead Processing**
- When you sync Gmail, new leads are automatically processed
- Only unanswered leads that haven't been auto-replied to are considered
- The system only auto-replies to **hot** and **warm** leads for safety

### 2. **AI Response Generation**
- Uses OpenAI to generate contextual, personalized responses
- Takes into account:
  - Your business context and services (from Settings)
  - The lead's email content and subject
  - Your preferred tone and response length
  - Your signature and custom phrases

### 3. **Email Sending**
- Sends replies directly through your Gmail account
- Uses the Gmail API with your authentication
- Maintains proper email threading with "Re:" subject prefix

### 4. **Tracking & Prevention of Duplicates**
- Marks leads as `answered` and `auto_replied` in the database
- Shows visual indicators (robot icon) for auto-replied leads
- Prevents sending multiple auto-replies to the same lead
- Tracks response time for analytics

## Setup Requirements

1. **Google Authentication**: You must be signed in with Google OAuth
2. **Auto-Reply Settings**: Configure your preferences in the Auto-Reply toggle
3. **Business Context**: Set up your business information in Settings → Advanced

## Configuration Options

### Tone Settings
- **Professional**: Formal, business-oriented responses
- **Friendly**: Warm, approachable responses  
- **Casual**: Relaxed, conversational responses

### Length Settings
- **Short**: 50-75 words
- **Medium**: 100-150 words
- **Detailed**: 200+ words

## Visual Indicators

- **Bot Icon (🤖)**: Shows on leads that have been auto-replied to
- **Green Background**: Answered leads have a subtle green tint
- **Status Badges**: Display both answered and auto-replied status

## Safety Features

1. **Lead Type Filtering**: Only replies to hot and warm leads
2. **Duplicate Prevention**: Won't send multiple replies to the same lead
3. **Manual Override**: You can always send your own reply after auto-reply
4. **Disable Toggle**: Easy on/off switch for the entire feature

## Database Schema

The feature adds these fields to the `leads` table:
- `auto_replied` (boolean): Tracks if a lead has been auto-replied to
- `gmail_reply_id` (text): Stores the Gmail message ID of the sent reply

## Edge Functions

### `send-email-reply`
- Handles the actual email sending via Gmail API
- Updates lead status after successful send
- Tracks email usage for billing

### `generate-ai-response`
- Generates personalized responses using OpenAI
- Uses your business context for customization
- Respects tone and length preferences

## Troubleshooting

### Auto-reply not working?
1. Check if the feature is enabled (toggle switch)
2. Verify you're signed in with Google
3. Ensure leads are classified as hot or warm
4. Check if leads are already marked as answered

### "No Google access token" error?
- Sign out and sign back in with Google
- Make sure you granted Gmail permissions

### Responses not personalized?
- Update your business context in Settings
- Add more details about your services and pricing
- Include custom phrases for your brand voice 