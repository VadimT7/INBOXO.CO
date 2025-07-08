import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function validateUser(authHeader: string | null, requestBody?: any) {
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Check if this is a service role call (from scheduled auto-sync)
  if (token === supabaseServiceKey) {
    console.log('Service role detected, checking for user_id in request body...');
    
    if (!requestBody?.user_id) {
      throw new Error('Service role calls must include user_id in request body');
    }
    
    // For service role calls, create a user object with the provided user_id
    const user = {
      id: requestBody.user_id,
      email: null, // We don't have email in service role context
      aud: 'authenticated',
      role: 'authenticated'
    };
    
    console.log('Service role user context created, ID:', user.id);
    return user;
  }

  // Regular user token validation
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Verifying user token...');
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);

  if (userError || !user) {
    console.error('User verification failed:', userError);
    throw new Error('Invalid user token');
  }

  console.log('User verified, ID:', user.id);
  return user;
}
