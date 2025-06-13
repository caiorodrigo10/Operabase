import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create database connection - use Supabase if URL is provided
let connectionString = process.env.DATABASE_URL;

if (process.env.SUPABASE_DATABASE_URL) {
  // Use Supabase URL directly, just encode the # character
  connectionString = process.env.SUPABASE_DATABASE_URL.replace('#', '%23');
  console.log('🔗 Conectando ao Supabase database...');
  console.log('🔍 Connection string format:', connectionString.split('@')[0] + '@[hidden]');
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