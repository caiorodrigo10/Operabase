/**
 * Script para adicionar livia_configuration_id na metadata da tabela documents
 * e atualizar a view v_n8n_clinic_config
 */

import { db } from './server/db.js';
import { sql } from 'drizzle-orm';

async function addLiviaConfigurationIdToDocuments() {
  try {
    console.log('🔧 IMPLEMENTANDO: livia_configuration_id na metadata documents + view v_n8n_clinic_config');
    console.log('=================================================================================');
    
    // ETAPA 1: Atualizar metadata dos documents existentes com livia_configuration_id
    console.log('\n📋 ETAPA 1: Atualizando metadata dos documents existentes...');
    
    // Buscar todos os documents que precisam de livia_configuration_id
    const documentsNeedingUpdate = await db.execute(sql`
      SELECT d.id, d.metadata, lc.id as livia_config_id
      FROM documents d
      LEFT JOIN livia_configurations lc ON lc.clinic_id = (d.metadata->>'clinic_id')::integer
      WHERE d.metadata IS NOT NULL 
        AND d.metadata->>'livia_configuration_id' IS NULL
        AND lc.id IS NOT NULL;
    `);
    
    console.log(`📊 Encontrados ${documentsNeedingUpdate.rows?.length || 0} documents para atualizar`);
    
    // Atualizar cada document com livia_configuration_id
    let updatedCount = 0;
    for (const doc of documentsNeedingUpdate.rows || []) {
      const currentMetadata = doc.metadata;
      const updatedMetadata = {
        ...currentMetadata,
        livia_configuration_id: doc.livia_config_id.toString()
      };
      
      await db.execute(sql`
        UPDATE documents 
        SET metadata = ${JSON.stringify(updatedMetadata)}
        WHERE id = ${doc.id};
      `);
      
      updatedCount++;
      console.log(`  ✅ Document ${doc.id}: adicionado livia_configuration_id = ${doc.livia_config_id}`);
    }
    
    console.log(`📊 Total atualizado: ${updatedCount} documents`);
    
    // ETAPA 2: Atualizar VIEW v_n8n_clinic_config para incluir livia_configuration_id
    console.log('\n📋 ETAPA 2: Atualizando VIEW v_n8n_clinic_config...');
    
    // Remover view existente
    console.log('🗑️ Removendo view v_n8n_clinic_config atual...');
    await db.execute(sql`DROP VIEW IF EXISTS v_n8n_clinic_config;`);
    
    // Criar nova view com livia_configuration_id
    console.log('🔧 Criando nova view v_n8n_clinic_config com livia_configuration_id...');
    await db.execute(sql`
      CREATE VIEW v_n8n_clinic_config AS
      SELECT 
        wn.clinic_id,
        wn.phone_number,
        wn.instance_name,
        lc.id as livia_configuration_id,  -- NOVO CAMPO ADICIONADO
        lc.general_prompt AS prompt_personalizado,
        lc.is_active AS livia_ativa,
        lc.created_at AS livia_configurada_em,
        lc.updated_at AS livia_atualizada_em,
        lc.connected_knowledge_base_ids,
        
        -- Dados dos profissionais estruturados
        CASE 
          WHEN lc.selected_professional_ids IS NOT NULL AND array_length(lc.selected_professional_ids, 1) > 0 THEN
            (SELECT json_agg(
              json_build_object(
                'id', u.id,
                'nome', u.name,
                'email', u.email,
                'principal', (u.id = lc.selected_professional_ids[1])
              )
            )
            FROM unnest(lc.selected_professional_ids) AS prof_id
            JOIN users u ON u.id = prof_id
            )
          ELSE '[]'::json
        END AS dados_profissionais,
        
        -- Primary knowledge base (primeiro da lista)
        CASE 
          WHEN lc.connected_knowledge_base_ids IS NOT NULL AND array_length(lc.connected_knowledge_base_ids, 1) > 0 
          THEN lc.connected_knowledge_base_ids[1]
          ELSE NULL
        END AS primary_knowledge_base_id
        
      FROM whatsapp_numbers wn
      LEFT JOIN livia_configurations lc ON lc.clinic_id = wn.clinic_id
      WHERE wn.status IN ('connected', 'open')
        AND wn.is_deleted = false
      ORDER BY wn.clinic_id;
    `);
    
    console.log('✅ Nova view v_n8n_clinic_config criada com sucesso!');
    
    // ETAPA 3: Validar nova estrutura
    console.log('\n📋 ETAPA 3: Validando nova estrutura...');
    
    // Testar nova view
    const newViewData = await db.execute(sql`
      SELECT clinic_id, livia_configuration_id, prompt_personalizado, 
             connected_knowledge_base_ids, primary_knowledge_base_id
      FROM v_n8n_clinic_config 
      LIMIT 2;
    `);
    
    console.log('🔍 Dados da nova view:');
    newViewData.rows?.forEach(row => {
      console.log(`  - Clínica ${row.clinic_id}:`);
      console.log(`    📝 Livia Config ID: ${row.livia_configuration_id}`);
      console.log(`    📚 Bases Conectadas: ${JSON.stringify(row.connected_knowledge_base_ids)}`);
      console.log(`    🎯 Primary KB ID: ${row.primary_knowledge_base_id}`);
    });
    
    // Validar documents atualizados
    const updatedDocuments = await db.execute(sql`
      SELECT id, metadata->>'livia_configuration_id' as livia_config_id,
             metadata->>'clinic_id' as clinic_id,
             metadata->>'knowledge_base_id' as kb_id
      FROM documents 
      WHERE metadata->>'livia_configuration_id' IS NOT NULL
      LIMIT 3;
    `);
    
    console.log('\n🔍 Documents com livia_configuration_id:');
    updatedDocuments.rows?.forEach(doc => {
      console.log(`  - Doc ${doc.id}: Clínica ${doc.clinic_id}, KB ${doc.kb_id}, Livia Config: ${doc.livia_config_id}`);
    });
    
    console.log('\n✅ IMPLEMENTAÇÃO COMPLETA!');
    console.log('📊 Resumo das mudanças:');
    console.log(`  ✅ ${updatedCount} documents atualizados com livia_configuration_id na metadata`);
    console.log('  ✅ VIEW v_n8n_clinic_config atualizada com nova coluna livia_configuration_id');
    console.log('  ✅ Sistema RAG agora referencia configurações da Livia diretamente');
    
    console.log('\n🎯 Uso no N8N:');
    console.log('  📝 Buscar configuração: SELECT livia_configuration_id, prompt_personalizado FROM v_n8n_clinic_config WHERE phone_number = "{{$json.from}}"');
    console.log('  📚 Filtrar documents: SELECT * FROM documents WHERE metadata->>\'livia_configuration_id\' = \'1\'');
    
  } catch (error) {
    console.error('❌ Erro na implementação:', error);
    throw error;
  }
}

// Executar implementação
addLiviaConfigurationIdToDocuments().then(() => {
  console.log('🏁 Script finalizado com sucesso');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});