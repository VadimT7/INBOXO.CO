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
