# AI Lead Classification Improvements

## Overview
Enhanced the AI lead classification system to properly consider urgency as a primary factor in determining lead temperature (hot/warm/cold).

## Problem Solved
Previously, emails with clear urgency indicators like "URGENT" in the subject and specific budget mentions were being incorrectly classified as "cold" leads. This was causing high-value, time-sensitive leads to be deprioritized.

## Key Improvements

### 1. **Urgency Detection System**
Added a dedicated urgency detection function that identifies:

**High Urgency Indicators:**
- Words: URGENT, ASAP, immediately, today, right now, emergency, critical
- Time-sensitive language: deadline, expedite, rush, priority
- Behavioral patterns: Extensive caps lock usage (>30% of text)
- Multiple exclamation marks (2 or more)

**Medium Urgency Indicators:**
- Time frames: this week, next week, soon
- Availability questions: when can, how soon, available
- Action words: quick, fast

### 2. **Enhanced AI Prompt**
Updated the classification prompt to:
- Explicitly consider urgency as a primary classification factor
- Provide clear examples of hot, warm, and cold leads
- Emphasize that urgent requests with clear intent should NEVER be cold
- Include reasoning in the response for transparency

### 3. **Classification Override Logic**
- If urgency detection finds high urgency indicators
- AND the AI classified the lead as "cold"
- The system overrides the classification to "hot"
- Adds explanation to the notes field

### 4. **Improved Classification Rules**

**HOT Leads:**
- Urgent language (URGENT, ASAP, etc.)
- Specific budget mentioned
- Immediate needs expressed
- Clear buying intent with time pressure

**WARM Leads:**
- General interest with moderate urgency
- Asking for quotes without immediate pressure
- Planning for near future (weeks/months)

**COLD Leads:**
- Just gathering information
- No urgency expressed
- Future/eventual needs
- Browsing without intent

## Example Fix
**Before:** "URGENT quote request" with $10,000 budget → Classified as COLD
**After:** "URGENT quote request" with $10,000 budget → Classified as HOT

## Technical Implementation

### Urgency Detection Function
```typescript
export function detectUrgencyLevel(subject: string, body: string): {
  level: 'high' | 'medium' | 'low';
  indicators: string[];
}
```

### Classification Flow
1. Extract email content
2. Detect urgency level and indicators
3. Send to AI for classification
4. Override if high urgency + cold classification
5. Store with detailed notes including urgency level

### Notes Field Enhancement
Now includes:
- AI reasoning
- Confidence percentage
- Urgency level
- Specific urgency indicators found

Example: `AI Classification: Clear service request with budget (Confidence: 95%) | Urgency: high (urgent, caps lock usage)`

## Benefits
- Better prioritization of time-sensitive leads
- Reduced risk of missing urgent opportunities
- More accurate lead temperature classification
- Transparent reasoning for classifications
- Improved auto-reply targeting (hot leads get immediate attention) 