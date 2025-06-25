/**
 * Adiciona coluna evolution_status à tabela messages
 * Para rastrear status de envio via Evolution API
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function addEvolutionStatusColumn() {
  console.log('🔧 Adicionando coluna evolution_status à tabela messages...');
  
  try {
    // Adicionar coluna evolution_status
    await db.execute(sql`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS evolution_status VARCHAR(20) DEFAULT 'pending';
    `);
    
    console.log('✅ Coluna evolution_status adicionada');
    
    // Criar índice para performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_messages_evolution_status 
      ON messages(evolution_status);
    `);
    
    console.log('✅ Índice criado para evolution_status');
    
    // Atualizar mensagens existentes como 'sent' (assumindo que são antigas e já foram enviadas)
    await db.execute(sql`
      UPDATE messages 
      SET evolution_status = 'sent' 
      WHERE evolution_status IS NULL;
    `);
    
    console.log('✅ Mensagens existentes marcadas como "sent"');
    
    console.log('🎉 Coluna evolution_status configurada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    throw error;
  }
}

addEvolutionStatusColumn();