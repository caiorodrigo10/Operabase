import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Create Supabase PostgreSQL connection pool
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project reference from Supabase URL and build connection string
let connectionString = process.env.DATABASE_URL;

if (supabaseUrl && supabaseServiceKey) {
  const projectRef = supabaseUrl.replace('https://', '').split('.')[0];
  connectionString = `postgresql://postgres.${projectRef}:${supabaseServiceKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
  console.log('🔗 Conectando ao Supabase database...');
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