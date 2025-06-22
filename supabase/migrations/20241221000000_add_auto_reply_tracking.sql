-- Add auto_replied column to leads table to track which leads have been auto-replied to
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS auto_replied BOOLEAN DEFAULT FALSE;

-- Add gmail_reply_id to track the Gmail message ID of the reply
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS gmail_reply_id TEXT;

-- Create an index on auto_replied for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_auto_replied ON leads(auto_replied);

-- Create an index on answered for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_answered ON leads(answered);

-- Update RLS policies to allow users to update their own leads
CREATE POLICY "Users can update their own leads" ON leads
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop the old update policy if it exists
DROP POLICY IF EXISTS "Users can update own leads" ON leads; 