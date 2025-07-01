/**
 * Script para analisar estrutura completa do banco de dados RAG e Livia
 * Verifica tabelas documents, metadata e views existentes
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function analyzeRAGLiviaStructure() {
  try {
    console.log('🔍 ANÁLISE COMPLETA: Estrutura RAG + Livia + N8N Views');
    console.log('==================================================');
    
    // 1. VERIFICAR ESTRUTURA DA TABELA DOCUMENTS
    console.log('\n📋 1. TABELA DOCUMENTS - Estrutura atual:');
    const documentsStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas encontradas:');
    documentsStructure.rows?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. EXAMINAR METADATA DA TABELA DOCUMENTS
    console.log('\n📋 2. METADATA EXAMPLES - Estrutura dos metadados:');
    const metadataExamples = await db.execute(sql`
      SELECT id, metadata 
      FROM documents 
      LIMIT 3;
    `);
    
    console.log('Exemplos de metadata:');
    metadataExamples.rows?.forEach(doc => {
      console.log(`  - ID ${doc.id}: ${JSON.stringify(doc.metadata, null, 2)}`);
    });
    
    // 3. VERIFICAR TABELA LIVIA_CONFIGURATIONS
    console.log('\n📋 3. TABELA LIVIA_CONFIGURATIONS - Estrutura atual:');
    const liviaStructure = await db.execute(sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'livia_configurations' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas encontradas:');
    liviaStructure.rows?.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 4. EXAMINAR DADOS DA LIVIA_CONFIGURATIONS
    console.log('\n📋 4. LIVIA_CONFIGURATIONS - Dados existentes:');
    const liviaData = await db.execute(sql`
      SELECT id, clinic_id, is_active, connected_knowledge_base_ids
      FROM livia_configurations 
      ORDER BY clinic_id;
    `);
    
    console.log('Configurações existentes:');
    liviaData.rows?.forEach(config => {
      console.log(`  - ID ${config.id}: Clínica ${config.clinic_id}, Ativa: ${config.is_active}, Bases: ${JSON.stringify(config.connected_knowledge_base_ids)}`);
    });
    
    // 5. VERIFICAR VIEWS N8N EXISTENTES
    console.log('\n📋 5. VIEWS N8N - Views existentes:');
    const views = await db.execute(sql`
      SELECT table_name, view_definition
      FROM information_schema.views 
      WHERE table_name LIKE 'v_n8n%';
    `);
    
    console.log('Views encontradas:');
    views.rows?.forEach(view => {
      console.log(`  - ${view.table_name}`);
      console.log(`    Definição: ${view.view_definition?.substring(0, 200)}...`);
    });
    
    // 6. TESTAR VIEW v_n8n_clinic_config SE EXISTIR
    console.log('\n📋 6. VIEW v_n8n_clinic_config - Teste de dados:');
    try {
      const configView = await db.execute(sql`
        SELECT * FROM v_n8n_clinic_config LIMIT 2;
      `);
      
      console.log('Dados da view:');
      configView.rows?.forEach(row => {
        console.log(`  - Clínica ${row.clinic_id}: ${JSON.stringify(row, null, 2)}`);
      });
    } catch (error) {
      console.log('  ❌ View v_n8n_clinic_config não existe ou tem erro:', error.message);
    }
    
    // 7. VERIFICAR RELACIONAMENTO DOCUMENTS <-> LIVIA
    console.log('\n📋 7. RELACIONAMENTO - Documents que deveriam ter livia_configuration_id:');
    const documentsWithoutLivia = await db.execute(sql`
      SELECT d.id, d.metadata->>'clinic_id' as clinic_id, 
             d.metadata->>'knowledge_base_id' as kb_id,
             lc.id as livia_config_id
      FROM documents d
      LEFT JOIN livia_configurations lc ON lc.clinic_id = (d.metadata->>'clinic_id')::integer
      LIMIT 5;
    `);
    
    console.log('Relação Documents -> Livia:');
    documentsWithoutLivia.rows?.forEach(doc => {
      console.log(`  - Doc ${doc.id}: Clínica ${doc.clinic_id}, KB ${doc.kb_id}, Livia Config ID: ${doc.livia_config_id}`);
    });
    
    console.log('\n✅ ANÁLISE COMPLETA FINALIZADA');
    console.log('📊 Próximos passos:');
    console.log('  1. Adicionar livia_configuration_id na metadata da tabela documents');
    console.log('  2. Atualizar view v_n8n_clinic_config para incluir livia_configuration_id');
    console.log('  3. Migrar dados existentes para incluir o relacionamento');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error);
  }
}

// Executar análise
analyzeRAGLiviaStructure().then(() => {
  console.log('🏁 Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});