/**
 * Script para limpar tabelas antigas do sistema RAG
 * Remove tabelas legadas após migração para estrutura oficial LangChain/Supabase
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

// Configurar conexão com Supabase
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL ou SUPABASE_POOLER_URL não configurado');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function cleanupOldRAGTables() {
  console.log('🧹 Iniciando limpeza de tabelas antigas do RAG...');
  
  // Lista de tabelas antigas do sistema RAG personalizado
  const oldTables = [
    'rag_documents',
    'rag_chunks', 
    'rag_embeddings',
    'rag_queries',
    'rag_knowledge_bases', // se existir separada da nova knowledge_bases
    'document_chunks', // possível variação
    'embeddings', // possível nome genérico
    'vector_store', // possível nome alternativo
  ];

  let removedCount = 0;
  let errors = 0;

  for (const tableName of oldTables) {
    try {
      // Verificar se a tabela existe
      const checkResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `);
      
      const tableExists = (checkResult.rows[0] as any).exists;
      
      if (tableExists) {
        console.log(`🗑️ Removendo tabela antiga: ${tableName}`);
        
        // Remover a tabela
        await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tableName} CASCADE;`));
        
        console.log(`✅ Tabela ${tableName} removida com sucesso`);
        removedCount++;
      } else {
        console.log(`ℹ️ Tabela ${tableName} não existe (já removida ou nunca existiu)`);
      }
      
    } catch (error) {
      console.error(`❌ Erro ao remover tabela ${tableName}:`, error);
      errors++;
    }
  }

  // Verificar se existem índices antigos relacionados
  try {
    console.log('\n🔍 Verificando índices antigos...');
    
    const indexResult = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND (indexname LIKE '%rag_%' OR indexname LIKE '%embedding_%')
      AND indexname NOT LIKE '%documents_%';
    `);
    
    for (const row of indexResult.rows) {
      const indexName = (row as any).indexname;
      try {
        console.log(`🗑️ Removendo índice antigo: ${indexName}`);
        await db.execute(sql.raw(`DROP INDEX IF EXISTS ${indexName};`));
        console.log(`✅ Índice ${indexName} removido`);
      } catch (error) {
        console.error(`❌ Erro ao remover índice ${indexName}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar índices:', error);
  }

  // Verificar se existem funções antigas
  try {
    console.log('\n🔍 Verificando funções antigas...');
    
    const functionsResult = await db.execute(sql`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%rag_%' 
      AND routine_name NOT IN ('match_documents', 'match_documents_clinic');
    `);
    
    for (const row of functionsResult.rows) {
      const functionName = (row as any).routine_name;
      try {
        console.log(`🗑️ Removendo função antiga: ${functionName}`);
        await db.execute(sql.raw(`DROP FUNCTION IF EXISTS ${functionName}() CASCADE;`));
        console.log(`✅ Função ${functionName} removida`);
      } catch (error) {
        console.error(`❌ Erro ao remover função ${functionName}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar funções:', error);
  }

  // Resumo final
  console.log('\n📊 Resumo da limpeza:');
  console.log(`✅ Tabelas removidas: ${removedCount}`);
  console.log(`❌ Erros encontrados: ${errors}`);
  
  if (removedCount > 0) {
    console.log('\n🎉 Limpeza concluída! Sistema RAG agora usa apenas estrutura oficial LangChain.');
  } else {
    console.log('\n✨ Sistema já estava limpo! Apenas tabelas oficiais encontradas.');
  }

  // Verificar estado final
  console.log('\n🔍 Verificando estado final do sistema...');
  const finalCheck = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name = 'documents' OR table_name = 'knowledge_bases')
    ORDER BY table_name;
  `);
  
  console.log('📋 Tabelas RAG oficiais presentes:');
  for (const row of finalCheck.rows) {
    console.log(`  ✅ ${(row as any).table_name}`);
  }
}

// Executar limpeza
cleanupOldRAGTables()
  .then(() => {
    console.log('\n🏁 Script de limpeza finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal na limpeza:', error);
    process.exit(1);
  });