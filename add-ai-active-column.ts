/**
 * Migration: Add ai_active column to conversations table
 * Adds boolean column with default value true to maintain current AI functionality
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function addAIActiveColumn() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL ou SUPABASE_POOLER_URL não encontrada');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🔄 Adicionando coluna ai_active na tabela conversations...');
    
    // Add ai_active column with default true
    await client`
      ALTER TABLE conversations 
      ADD COLUMN IF NOT EXISTS ai_active BOOLEAN DEFAULT true
    `;
    
    console.log('✅ Coluna ai_active adicionada com sucesso');
    console.log('✅ Todas as conversas existentes agora têm ai_active = true por padrão');
    
    // Verify the column was added
    const result = await client`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'conversations' AND column_name = 'ai_active'
    `;
    
    if (result.length > 0) {
      console.log('✅ Verificação: Coluna ai_active existe na tabela conversations');
      console.log('📊 Detalhes:', result[0]);
    } else {
      console.log('❌ Erro: Coluna ai_active não foi encontrada após criação');
    }
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna ai_active:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Execute migration
addAIActiveColumn().catch(console.error);