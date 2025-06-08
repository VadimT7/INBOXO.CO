-- Add emails_sent column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS emails_sent INTEGER DEFAULT 0;

-- Create function to increment emails_sent counter
CREATE OR REPLACE FUNCTION increment_emails_sent(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles 
  SET 
    emails_sent = COALESCE(emails_sent, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id_param;
  
  -- If no row was updated, insert a new profile
  IF NOT FOUND THEN
    INSERT INTO profiles (id, emails_sent, updated_at)
    VALUES (user_id_param, 1, NOW())
    ON CONFLICT (id) DO UPDATE SET
      emails_sent = COALESCE(profiles.emails_sent, 0) + 1,
      updated_at = NOW();
  END IF;
END;
$$; 