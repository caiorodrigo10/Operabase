import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

async function manualSchemaFix() {
  console.log('🔧 Applying manual schema fix for storage columns...');

  // Use the pooler URL that's working in the application
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  try {
    console.log('📋 Adding storage columns to message_attachments...');
    
    // Apply each column individually to avoid syntax issues
    const queries = [
      "ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(100) DEFAULT 'conversation-attachments'",
      "ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500)",
      "ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS public_url TEXT",
      "ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS signed_url TEXT",
      "ALTER TABLE message_attachments ADD COLUMN IF NOT EXISTS signed_url_expires TIMESTAMP"
    ];

    for (const query of queries) {
      try {
        await sql(query);
        console.log(`✅ Executed: ${query.slice(0, 50)}...`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Column already exists: ${query.slice(0, 50)}...`);
        } else {
          console.error(`❌ Error: ${query.slice(0, 50)}...`, error.message);
        }
      }
    }

    // Add indexes
    const indexQueries = [
      "CREATE INDEX IF NOT EXISTS idx_message_attachments_storage_path ON message_attachments(storage_path)",
      "CREATE INDEX IF NOT EXISTS idx_message_attachments_storage_bucket ON message_attachments(storage_bucket)"
    ];

    for (const query of indexQueries) {
      try {
        await sql(query);
        console.log(`✅ Index created: ${query.slice(0, 50)}...`);
      } catch (error: any) {
        console.log(`⚠️ Index exists or error: ${error.message}`);
      }
    }

    // Verify columns exist
    const result = await sql(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'message_attachments' 
      AND column_name IN ('storage_bucket', 'storage_path', 'public_url', 'signed_url', 'signed_url_expires')
      ORDER BY column_name;
    `);

    console.log('📋 Storage columns verified:');
    console.table(result);

    if (result.length === 5) {
      console.log('✅ All storage columns successfully applied');
    } else {
      console.log(`⚠️ Only ${result.length}/5 columns found`);
    }

  } catch (error) {
    console.error('💥 Manual schema fix failed:', error);
  }
}

manualSchemaFix();