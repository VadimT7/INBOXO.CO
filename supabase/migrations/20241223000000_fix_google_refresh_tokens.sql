-- Migration to fix Google refresh token storage for auto-sync
-- This ensures refresh tokens are properly stored when users sign in with Google

-- Function to extract and store Google refresh token from auth identities
CREATE OR REPLACE FUNCTION handle_google_refresh_token()
RETURNS TRIGGER AS $$
DECLARE
  refresh_token TEXT;
BEGIN
  -- Only process Google OAuth identities that have refresh token in identity_data
  IF NEW.provider = 'google' AND NEW.identity_data IS NOT NULL THEN
    -- Extract refresh_token from the JSONB identity_data
    refresh_token := NEW.identity_data->>'refresh_token';
    
    -- If we have a refresh token, store it in the profile
    IF refresh_token IS NOT NULL AND refresh_token != '' THEN
      -- Update the user's profile with the refresh token
      UPDATE profiles 
      SET 
        google_refresh_token = refresh_token,
        auto_sync_enabled = true, -- Enable auto-sync by default for Google users
        updated_at = NOW()
      WHERE id = NEW.user_id;
      
      -- Log the token storage (without exposing the actual token)
      RAISE LOG 'Stored Google refresh token for user %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.identities to capture refresh tokens
DROP TRIGGER IF EXISTS on_google_identity_trigger ON auth.identities;
CREATE TRIGGER on_google_identity_trigger
  AFTER INSERT ON auth.identities
  FOR EACH ROW
  EXECUTE FUNCTION handle_google_refresh_token();

-- Also handle updates to identities (token refresh)
DROP TRIGGER IF EXISTS on_google_identity_update_trigger ON auth.identities;
CREATE TRIGGER on_google_identity_update_trigger
  AFTER UPDATE ON auth.identities
  FOR EACH ROW
  WHEN (NEW.identity_data IS DISTINCT FROM OLD.identity_data)
  EXECUTE FUNCTION handle_google_refresh_token();

-- Add comment explaining the functionality
COMMENT ON FUNCTION handle_google_refresh_token() IS 'Automatically stores Google refresh tokens in user profiles for background auto-sync';

-- Ensure auto_sync_enabled defaults to true for new profiles
ALTER TABLE profiles ALTER COLUMN auto_sync_enabled SET DEFAULT true;

-- Update existing Google users to have auto_sync enabled and extract refresh tokens
DO $$
DECLARE
  identity_record RECORD;
  refresh_token TEXT;
BEGIN
  -- Loop through all Google identities that have refresh tokens
  FOR identity_record IN 
    SELECT user_id, identity_data 
    FROM auth.identities 
    WHERE provider = 'google' 
    AND identity_data IS NOT NULL
  LOOP
    -- Extract refresh token from identity_data
    refresh_token := identity_record.identity_data->>'refresh_token';
    
    -- Update profile if we have a refresh token
    IF refresh_token IS NOT NULL AND refresh_token != '' THEN
      UPDATE profiles 
      SET 
        google_refresh_token = refresh_token,
        auto_sync_enabled = true,
        updated_at = NOW()
      WHERE id = identity_record.user_id;
      
      RAISE LOG 'Updated Google refresh token for existing user %', identity_record.user_id;
    ELSE
      -- Enable auto-sync even without refresh token (user will need to re-auth)
      UPDATE profiles 
      SET 
        auto_sync_enabled = true,
        updated_at = NOW()
      WHERE id = identity_record.user_id;
    END IF;
  END LOOP;
END $$; 