import { Pool } from "pg";

console.log('🔍 Testing Supabase connection directly...');

let connectionString = process.env.SUPABASE_POOLER_URL;

if (!connectionString) {
  console.error('❌ SUPABASE_CONNECTION_STRING not found');
  process.exit(1);
}

console.log('Original:', connectionString.split('@')[0] + '@[hidden]');

// Convert to pooler format if it's direct connection
if (connectionString.includes('db.') && connectionString.includes('.supabase.co:5432')) {
  const projectRef = connectionString.match(/db\.(\w+)\.supabase\.co/)?.[1];
  const password = connectionString.match(/:([^@]+)@/)?.[1];
  if (projectRef && password) {
    const encodedPassword = encodeURIComponent(password);
    connectionString = `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;
    console.log('Converted to pooler:', connectionString.split('@')[0] + '@[hidden]');
  }
}

async function testConnection() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🔌 Attempting connection...');
    const client = await pool.connect();
    console.log('✅ Connected successfully');
    
    console.log('🔍 Testing query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query successful:', result.rows[0]);
    
    console.log('🔍 Testing tables...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('📋 Available tables:', tables.rows.map(r => r.table_name));
    
    client.release();
    await pool.end();
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    await pool.end();
    process.exit(1);
  }
}

testConnection();