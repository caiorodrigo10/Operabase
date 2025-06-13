import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create database connection - use Supabase if URL is provided
let supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

// Fix Supabase URL format if needed
if (supabaseDbUrl) {
  // URL encode special characters in password
  if (supabaseDbUrl.includes('#')) {
    supabaseDbUrl = supabaseDbUrl.replace(/#/g, '%23');
  }
  
  // Convert direct connection to pooler if needed
  if (supabaseDbUrl.includes('db.') && supabaseDbUrl.includes('.supabase.co:5432')) {
    const projectRef = supabaseDbUrl.match(/db\.(\w+)\.supabase\.co/)?.[1];
    const password = supabaseDbUrl.match(/:([^@]+)@/)?.[1];
    if (projectRef && password) {
      const encodedPassword = encodeURIComponent(password);
      supabaseDbUrl = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
    }
  }
  console.log('🔗 Conectando ao Supabase database...');
} else {
  console.log('🔗 Usando PostgreSQL local...');
}

const connectionString = supabaseDbUrl || process.env.DATABASE_URL;

const pool = new Pool({
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