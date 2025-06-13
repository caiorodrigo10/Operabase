import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Force Supabase connection - override DATABASE_URL
let connectionString = process.env.SUPABASE_POOLER_URL || process.env.SUPABASE_CONNECTION_STRING || process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (process.env.SUPABASE_POOLER_URL) {
  // Use Supabase pooler URL (preferred)
  connectionString = process.env.SUPABASE_POOLER_URL;
  
  // Fix common issues with Supabase URLs
  if (connectionString.startsWith('postgres://')) {
    connectionString = connectionString.replace('postgres://', 'postgresql://');
  }
  if (connectionString.includes('#')) {
    connectionString = connectionString.replace(/#/g, '%23');
  }
  
  console.log('🔗 Conectando ao Supabase database (pooler)...');
  console.log('🔍 Connection string format:', connectionString.split('@')[0] + '@[hidden]');
  console.log('🔍 Using SUPABASE_POOLER_URL:', !!process.env.SUPABASE_POOLER_URL);
  console.log('🔍 Using DATABASE_URL:', !!process.env.DATABASE_URL);
} else if (process.env.SUPABASE_CONNECTION_STRING) {
  // Use Supabase connection string
  connectionString = process.env.SUPABASE_CONNECTION_STRING;
  console.log('🔗 Conectando ao Supabase database...');
} else if (process.env.SUPABASE_DATABASE_URL) {
  // Fallback to old URL with encoding
  connectionString = process.env.SUPABASE_DATABASE_URL.replace('#', '%23');
  console.log('🔗 Conectando ao Supabase database (fallback)...');
} else {
  console.log('🔗 Usando PostgreSQL local...');
}

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// Create Drizzle instance
export const db = drizzle(pool, { schema });

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Close database connection
export async function closeConnection() {
  await pool.end();
}