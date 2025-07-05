-- Add fields for auto-sync functionality
ALTER TABLE profiles 
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN last_auto_sync TIMESTAMPTZ,
ADD COLUMN auto_sync_enabled BOOLEAN DEFAULT true;

-- Add index for efficient auto-sync queries
CREATE INDEX idx_profiles_auto_sync ON profiles(auto_sync_enabled, last_auto_sync) 
WHERE auto_sync_enabled = true AND google_refresh_token IS NOT NULL;

-- Add RLS policies for the new fields
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only update their own auto-sync settings
CREATE POLICY "Users can update own auto-sync settings" ON profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Service role can read all profiles for auto-sync (but not refresh tokens in normal queries)
CREATE POLICY "Service role can access profiles for auto-sync" ON profiles
FOR ALL USING (
  current_setting('role') = 'service_role' OR 
  auth.uid() = id
);

-- Add comment explaining the fields
COMMENT ON COLUMN profiles.google_refresh_token IS 'Encrypted Google OAuth refresh token for background sync';
COMMENT ON COLUMN profiles.last_auto_sync IS 'Timestamp of last successful auto-sync';
COMMENT ON COLUMN profiles.auto_sync_enabled IS 'Whether auto-sync is enabled for this user'; 