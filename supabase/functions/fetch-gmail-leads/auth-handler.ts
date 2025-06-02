
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function validateUser(authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Verifying user token...');
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (userError || !user) {
    console.error('User verification failed:', userError);
    throw new Error('Invalid user token');
  }

  console.log('User verified, ID:', user.id);
  return user;
}

export async function getUserProfile(userId: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Fetching user profile...');
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('google_access_token')
    .eq('id', userId)
    .single();

  if (profileError && profileError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    console.log('Profile not found, creating new profile...');
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        updated_at: new Date().toISOString()
      })
      .select('google_access_token')
      .single();

    if (createError) {
      console.error('Error creating profile:', createError);
      throw new Error('Failed to create user profile');
    }

    profile = newProfile;
    console.log('Profile created successfully');
  } else if (profileError) {
    console.error('Profile fetch error:', profileError);
    throw new Error('Failed to fetch user profile');
  }

  if (!profile?.google_access_token) {
    throw new Error('No Google access token found. Please sign out and sign in again with Google to enable Gmail sync.');
  }

  return profile;
}
