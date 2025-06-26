import { createClient } from '@supabase/supabase-js';

async function applyStorageSchema() {
  console.log('🔧 Applying Supabase Storage schema via direct connection...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase credentials not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Apply storage columns directly using Supabase client
    const { data, error } = await supabase
      .from('message_attachments')
      .select('id, storage_bucket')
      .limit(1);

    if (error && error.code === '42703') {
      console.log('📋 Storage columns missing, applying schema...');
      
      // Use raw SQL via Supabase
      const { error: schemaError } = await supabase.rpc('exec_sql', {
        query: `
          ALTER TABLE message_attachments 
          ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(100) DEFAULT 'conversation-attachments',
          ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500),
          ADD COLUMN IF NOT EXISTS public_url TEXT,
          ADD COLUMN IF NOT EXISTS signed_url TEXT,
          ADD COLUMN IF NOT EXISTS signed_url_expires TIMESTAMP;
          
          CREATE INDEX IF NOT EXISTS idx_message_attachments_storage_path ON message_attachments(storage_path);
          CREATE INDEX IF NOT EXISTS idx_message_attachments_storage_bucket ON message_attachments(storage_bucket);
        `
      });

      if (schemaError) {
        console.error('❌ Schema application failed:', schemaError);
      } else {
        console.log('✅ Storage schema applied successfully');
      }
    } else if (!error) {
      console.log('✅ Storage columns already exist');
    } else {
      console.error('❌ Error checking storage columns:', error);
    }

  } catch (err) {
    console.error('💥 Unexpected error in storage schema application:', err);
  }
}

applyStorageSchema();