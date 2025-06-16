import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createProfile() {
  console.log('🔍 Attempting to create profiles table and user profile...');
  
  // First, try to create the profiles table using raw SQL
  try {
    const { error: createTableError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          name text,
          email text,
          role text DEFAULT 'user',
          clinic_id integer,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
      `
    });
    
    if (createTableError) {
      console.log('Creating table via SQL...', createTableError.message || 'Unknown error');
    } else {
      console.log('✅ Profiles table ready');
    }
  } catch (e) {
    console.log('Table creation may have failed, continuing...');
  }
  
  console.log('🔍 Checking for existing profile...');
  
  try {
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4')
      .single();
      
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile);
      return;
    }
  } catch (error) {
    console.log('📝 Profile not found, creating new one...');
  }
  
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: '3cd96e6d-81f2-4c8a-a54d-3abac77b37a4',
      name: 'Caio Rodrigo',
      email: 'cr@caiorodrigo.com.br',
      role: 'super_admin',
      clinic_id: 1
    })
    .select()
    .single();
    
  if (error) {
    console.error('❌ Error creating profile:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Profile created successfully:', data);
  }
}

createProfile().catch(console.error);