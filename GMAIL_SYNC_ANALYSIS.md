# Gmail Sync Analysis & Fix

## Current Sync Parameters (Before Fix)

### Timeframe
- **Period**: Last 7 days (`newer_than:7d`)
- **Incoming emails**: Fetches up to 30 messages, processes only 15
- **Sent emails**: Fetches up to 20 messages, processes all

### Query Parameters
- **Incoming**: `newer_than:7d` (basic query, no filtering)
- **Sent**: `in:sent newer_than:7d`

### Processing Limits
- **Incoming messages processed**: 15 out of 30 fetched
- **Sent messages processed**: All fetched (up to 20)

## Root Causes of Inconsistency

### 1. **Non-Deterministic Ordering**
- Gmail API returns results without guaranteed order
- No sorting applied to messages before processing
- Different API calls can return messages in different sequences

### 2. **Processing Limits vs Fetch Limits**
- Fetches 30 messages but only processes 15
- Which 15 get processed depends on API response order
- Creates inconsistency when the same emails are fetched in different orders

### 3. **Insufficient Duplicate Detection**
- Only relies on database constraints for deduplication
- No pre-processing duplicate check
- Can lead to processing the same emails multiple times

### 4. **Race Conditions**
- Quick delete → resync operations can hit Gmail indexing delays
- No consideration for Gmail's eventual consistency

### 5. **Limited Automated Email Filtering**
- Basic sender-based filtering only
- No subject-line based automated email detection
- Can process newsletters, notifications, etc. as leads

## Implemented Fixes

### 1. **Deterministic Processing Order**
```typescript
// Sort messages by ID for consistent processing
const sortedMessages = incomingData.messages.sort((a, b) => a.id.localeCompare(b.id));
```

### 2. **Enhanced Duplicate Detection**
```typescript
// Pre-fetch existing leads to avoid duplicates
const { data: existingLeads } = await supabase
  .from('leads')
  .select('gmail_message_id, sender_email, subject')
  .eq('user_id', user.id);

const existingMessageIds = new Set(existingLeads?.map(lead => lead.gmail_message_id) || []);

// Skip processing if message already exists
if (existingMessageIds.has(message.id)) {
  console.log(`Skipping duplicate message: ${message.id}`);
  skippedDuplicates++;
  continue;
}
```

### 3. **Improved Query Filtering**
```typescript
// Enhanced query to exclude common automated emails
const incomingQuery = `newer_than:7d -from:noreply -from:no-reply -from:donotreply -from:do-not-reply -from:automated -from:notification`;
```

### 4. **Enhanced Automated Email Detection**
```typescript
function isAutomatedSubject(subject: string): boolean {
  const automatedPatterns = [
    /^(re:|fwd:|fw:)?\s*(unsubscribe|newsletter|notification|alert|reminder|receipt|invoice|confirmation)/i,
    /^(re:|fwd:|fw:)?\s*(no.?reply|do.?not.?reply|automated|system)/i,
    /^(re:|fwd:|fw:)?\s*(delivery|bounce|failure|error|warning)/i
  ];
  
  return automatedPatterns.some(pattern => pattern.test(subject));
}
```

### 5. **Increased Processing Limits**
- **Incoming**: Fetch 50, process 25 (increased from 30/15)
- **Sent**: Fetch 30, process all (increased from 20)

### 6. **Better Response Matching**
```typescript
function isReplyToSubject(sentSubject: string, originalSubject: string): boolean {
  const cleanSentSubject = sentSubject.toLowerCase().replace(/^(re:|fwd:|fw:)\s*/i, '').trim();
  const cleanOriginalSubject = originalSubject.toLowerCase().trim();
  
  return cleanSentSubject.includes(cleanOriginalSubject) || 
         cleanOriginalSubject.includes(cleanSentSubject) ||
         sentSubject.toLowerCase().includes('re:');
}
```

### 7. **Enhanced Logging & Debugging**
```typescript
const result = { 
  message: 'Gmail sync completed successfully', 
  new_leads: leads.length,
  responses_tracked: sentEmailsProcessed,
  total_processed: totalProcessed,
  skipped_duplicates: skippedDuplicates,
  incoming_found: incomingData.messages?.length || 0,
  sent_found: sentData.messages?.length || 0,
  sync_timestamp: new Date().toISOString(),
  sync_parameters: {
    timeframe: '7 days',
    incoming_query: incomingQuery,
    sent_query: sentQuery,
    max_incoming_processed: 25,
    max_sent_processed: 30
  }
};
```

## New Sync Parameters (After Fix)

### Timeframe
- **Period**: Still 7 days (configurable)
- **Incoming emails**: Fetch 50, process 25 (deterministically sorted)
- **Sent emails**: Fetch 30, process all (deterministically sorted)

### Query Parameters
- **Incoming**: `newer_than:7d -from:noreply -from:no-reply -from:donotreply -from:do-not-reply -from:automated -from:notification`
- **Sent**: `in:sent newer_than:7d`

### Processing Guarantees
1. **Deterministic order**: Messages always processed in same order (sorted by ID)
2. **Duplicate prevention**: Pre-check against existing leads
3. **Enhanced filtering**: Better automated email detection
4. **Consistent results**: Same inputs always produce same outputs

## Testing the Fix

### Reproducibility Test
1. Sync emails → Record results
2. Delete account data
3. Resync emails → Compare results
4. Results should now be identical (within the processing limits)

### Expected Behavior
- Same emails should always be processed in the same order
- Duplicate detection should prevent reprocessing
- Automated emails should be consistently filtered out
- Response tracking should be more accurate

## Monitoring & Debugging

The sync now returns detailed information:
- `skipped_duplicates`: Number of already-processed emails
- `sync_timestamp`: Exact time of sync
- `sync_parameters`: All parameters used for the sync
- Enhanced logging for troubleshooting

## Recommendations

1. **Monitor sync results** using the new detailed response
2. **Adjust processing limits** if needed (currently 25/30)
3. **Consider implementing** incremental sync based on last sync timestamp
4. **Add user-configurable** sync frequency and filters
5. **Implement retry logic** for failed message processing 