import { createClient } from '@supabase/supabase-js';

async function addLunchBreakColumn() {
  console.log('🔧 Adding has_lunch_break column to clinics table...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Add the column
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE clinics ADD COLUMN IF NOT EXISTS has_lunch_break BOOLEAN DEFAULT true;'
    });
    
    if (error) {
      console.error('❌ Error adding column:', error);
      return;
    }
    
    console.log('✅ Successfully added has_lunch_break column');
    
    // Verify the column was added
    const { data: clinics, error: selectError } = await supabase
      .from('clinics')
      .select('id, has_lunch_break')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Error verifying column:', selectError);
    } else {
      console.log('✅ Column verified:', clinics);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

addLunchBreakColumn();