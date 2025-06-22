# Revert Summary

## Changes Reverted

### 1. **Deleted Files**
- `supabase/migrations/20241222000000_add_google_token_to_profiles.sql` - Migration for google_access_token column
- `AUTO_REPLY_TOKEN_FIX.md` - Documentation file

### 2. **Reverted useAutoReply Hook**
- Restored to use `session?.provider_token` instead of fetching from profiles table
- Removed extra logging and error messages

### 3. **Reverted useGmailSync Hook**
- Restored to use `session.session.provider_token` instead of fetching from profiles table
- Removed profile query logic

### 4. **Reverted useAuthSession Hook**
- Removed extra logging in `updateProfileWithToken`
- Removed the line that tried to save `google_access_token` to profiles
- Removed toast error messages

### 5. **Fixed Type Definitions**
- Removed `google_access_token` from `src/types/supabase.ts`
- Removed `google_access_token` from `src/integrations/supabase/types.ts`
- Restored proper profiles table structure with subscription fields

### 6. **Fixed Edge Function**
- Removed unused `getUserProfile` function from `supabase/functions/fetch-gmail-leads/auth-handler.ts`
- This function was trying to query the non-existent `google_access_token` column

## Current State

The codebase is now restored to its original state before the google_access_token implementation. The auto-reply feature will have the same limitation as before - it only works immediately after login when the provider_token is available in the session.

## Login Should Work Now

The login issue was likely caused by the edge function trying to query a non-existent `google_access_token` column in the profiles table. With all references removed, login should work normally again. 