/**
 * Add disconnected_at column to whatsapp_numbers table
 * Supporting reconnection feature implementation
 */

import { sql } from 'drizzle-orm';
import { createConnection } from './server/db';

async function addDisconnectedAtColumn() {
  console.log('🔧 Adding disconnected_at column to whatsapp_numbers table...');
  
  try {
    const db = await createConnection();
    
    // Add disconnected_at column
    await db.execute(sql`
      ALTER TABLE whatsapp_numbers 
      ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMP;
    `);
    
    console.log('✅ disconnected_at column added successfully');
    
    // Verify the column was added
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'whatsapp_numbers' 
      AND column_name = 'disconnected_at';
    `);
    
    console.log('🔍 Column verification:', result.rows);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error adding disconnected_at column:', error);
    process.exit(1);
  }
}

addDisconnectedAtColumn();