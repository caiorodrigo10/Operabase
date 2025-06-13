import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create database connection - use Supabase if URL is provided
let connectionString = process.env.DATABASE_URL;

if (process.env.SUPABASE_POOLER_URL) {
  // Use Supabase pooler URL (preferred)
  connectionString = process.env.SUPABASE_POOLER_URL;
  console.log('🔗 Conectando ao Supabase database (pooler)...');
  console.log('🔍 Connection string format:', connectionString.split('@')[0] + '@[hidden]');
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