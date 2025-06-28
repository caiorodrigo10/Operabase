/**
 * Migração: Adicionar colunas clinic_id e knowledge_base_id à tabela rag_embeddings
 * Implementa sistema multi-tenant para embeddings RAG
 */

import { sql } from 'drizzle-orm';
import { getDB } from './server/storage.js';

// Usar a conexão existente do sistema
const db = getDB();

async function addClinicKnowledgeBaseToRagEmbeddings() {
  console.log('🚀 Iniciando migração: Adicionar clinic_id e knowledge_base_id à rag_embeddings');
  
  try {
    // ETAPA 1: Adicionar colunas (permitindo NULL inicialmente)
    console.log('\n📝 ETAPA 1: Adicionando colunas clinic_id e knowledge_base_id...');
    
    await db.execute(sql`
      ALTER TABLE rag_embeddings 
      ADD COLUMN IF NOT EXISTS clinic_id INTEGER;
    `);
    
    await db.execute(sql`
      ALTER TABLE rag_embeddings 
      ADD COLUMN IF NOT EXISTS knowledge_base_id INTEGER;
    `);
    
    console.log('✅ Colunas adicionadas com sucesso');

    // ETAPA 2: Verificar dados existentes
    console.log('\n🔍 ETAPA 2: Verificando dados existentes na tabela...');
    
    const existingEmbeddings = await db.execute(sql`
      SELECT COUNT(*) as total FROM rag_embeddings;
    `);
    
    const embeddingsCount = existingEmbeddings[0]?.total || 0;
    console.log(`📊 Total de embeddings existentes: ${embeddingsCount}`);

    if (embeddingsCount > 0) {
      // ETAPA 3: Preencher clinic_id baseado no relacionamento existente
      console.log('\n🔄 ETAPA 3: Preenchendo clinic_id baseado em relacionamentos...');
      
      const updateClinicResult = await db.execute(sql`
        UPDATE rag_embeddings 
        SET clinic_id = (
          SELECT CASE 
            WHEN rd.external_user_id ~ '^[0-9]+$' THEN CAST(rd.external_user_id AS INTEGER)
            ELSE 1
          END
          FROM rag_chunks rc 
          JOIN rag_documents rd ON rc.document_id = rd.id 
          WHERE rc.id = rag_embeddings.chunk_id
        )
        WHERE clinic_id IS NULL;
      `);
      
      console.log(`✅ clinic_id atualizado para ${updateClinicResult.count} registros`);

      // ETAPA 4: Preencher knowledge_base_id quando possível
      console.log('\n🔄 ETAPA 4: Preenchendo knowledge_base_id quando disponível...');
      
      const updateKnowledgeBaseResult = await db.execute(sql`
        UPDATE rag_embeddings 
        SET knowledge_base_id = (
          SELECT rkb.id 
          FROM rag_chunks rc 
          JOIN rag_documents rd ON rc.document_id = rd.id 
          JOIN rag_knowledge_bases rkb ON rd.external_user_id = rkb.external_user_id
          WHERE rc.id = rag_embeddings.chunk_id
          LIMIT 1
        )
        WHERE knowledge_base_id IS NULL;
      `);
      
      console.log(`✅ knowledge_base_id atualizado para ${updateKnowledgeBaseResult.count} registros`);
    }

    // ETAPA 5: Tornar clinic_id obrigatório
    console.log('\n🔒 ETAPA 5: Tornando clinic_id obrigatório...');
    
    await db.execute(sql`
      ALTER TABLE rag_embeddings 
      ALTER COLUMN clinic_id SET NOT NULL;
    `);
    
    console.log('✅ clinic_id agora é obrigatório');

    // ETAPA 6: Adicionar foreign keys (se as tabelas existirem)
    console.log('\n🔗 ETAPA 6: Adicionando foreign keys...');
    
    // Verificar se tabela clinics existe
    const clinicsTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clinics'
      );
    `);
    
    if (clinicsTableExists[0]?.exists) {
      await db.execute(sql`
        ALTER TABLE rag_embeddings 
        ADD CONSTRAINT IF NOT EXISTS fk_rag_embeddings_clinic 
        FOREIGN KEY (clinic_id) REFERENCES clinics(id);
      `);
      console.log('✅ Foreign key para clinics adicionada');
    } else {
      console.log('⚠️ Tabela clinics não encontrada - foreign key não adicionada');
    }

    // Foreign key para knowledge_bases
    await db.execute(sql`
      ALTER TABLE rag_embeddings 
      ADD CONSTRAINT IF NOT EXISTS fk_rag_embeddings_knowledge_base 
      FOREIGN KEY (knowledge_base_id) REFERENCES rag_knowledge_bases(id);
    `);
    
    console.log('✅ Foreign key para rag_knowledge_bases adicionada');

    // ETAPA 7: Criar índices de performance
    console.log('\n⚡ ETAPA 7: Criando índices de performance...');
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rag_embeddings_clinic 
      ON rag_embeddings(clinic_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rag_embeddings_knowledge_base 
      ON rag_embeddings(knowledge_base_id);
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_rag_embeddings_clinic_kb 
      ON rag_embeddings(clinic_id, knowledge_base_id);
    `);
    
    console.log('✅ Índices de performance criados');

    // ETAPA 8: Verificar resultado final
    console.log('\n📊 ETAPA 8: Verificando resultado final...');
    
    const finalStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_embeddings,
        COUNT(clinic_id) as embeddings_with_clinic,
        COUNT(knowledge_base_id) as embeddings_with_kb,
        COUNT(DISTINCT clinic_id) as unique_clinics,
        COUNT(DISTINCT knowledge_base_id) as unique_knowledge_bases
      FROM rag_embeddings;
    `);
    
    const stats = finalStats[0];
    console.log('📈 Estatísticas finais:');
    console.log(`   • Total de embeddings: ${stats.total_embeddings}`);
    console.log(`   • Com clinic_id: ${stats.embeddings_with_clinic}`);
    console.log(`   • Com knowledge_base_id: ${stats.embeddings_with_kb}`);
    console.log(`   • Clínicas únicas: ${stats.unique_clinics}`);
    console.log(`   • Bases de conhecimento únicas: ${stats.unique_knowledge_bases}`);

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('✅ Tabela rag_embeddings agora suporta multi-tenant com clinic_id e knowledge_base_id');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    // Conexão será fechada automaticamente pelo sistema
  }
}

// Executar migração
addClinicKnowledgeBaseToRagEmbeddings()
  .then(() => {
    console.log('\n✅ Script executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha na execução do script:', error);
    process.exit(1);
  });

export { addClinicKnowledgeBaseToRagEmbeddings };