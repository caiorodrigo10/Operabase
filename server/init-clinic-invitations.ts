import { sql } from "drizzle-orm";
import { db } from "./db";

export async function initClinicInvitationsSystem() {
  try {
    console.log('🏥 Initializing Clinic Invitations system...');
    
    // First, add status column to clinics table if it doesn't exist
    console.log('🔧 Adding status column to clinics table...');
    await db.execute(sql`
      ALTER TABLE clinics 
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';
    `);
    
    // Create clinic_invitations table
    console.log('🔧 Creating clinic_invitations table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS clinic_invitations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        admin_email VARCHAR(255) NOT NULL,
        admin_name VARCHAR(255) NOT NULL,
        clinic_name VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        created_by_user_id INTEGER NOT NULL,
        clinic_id INTEGER NULL,
        expires_at TIMESTAMP NOT NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    console.log('🔧 Creating indexes...');
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_clinic_invitations_token ON clinic_invitations(token);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_clinic_invitations_status ON clinic_invitations(status);`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_clinic_invitations_created_by ON clinic_invitations(created_by_user_id);`);

    console.log('✅ Clinic Invitations system initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize Clinic Invitations system:', error);
    throw error;
  }
}