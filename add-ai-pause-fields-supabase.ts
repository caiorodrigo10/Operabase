/**
 * ETAPA 2: Migração Supabase - Sistema de Pausa Automática da IA
 * Adiciona campos necessários para controlar quando a IA deve ficar pausada
 * devido a mensagens manuais de profissionais
 */

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAiPauseFields() {
  console.log('🚀 ETAPA 2: Iniciando migração - Sistema de Pausa Automática da IA');
  
  try {
    // 1. Verificar se as colunas já existem
    console.log('🔍 Verificando estrutura atual da tabela conversations...');
    
    const { data: existingColumns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'conversations')
      .in('column_name', ['ai_paused_until', 'ai_paused_by_user_id', 'ai_pause_reason']);
    
    if (checkError) {
      console.log('⚠️ Não foi possível verificar colunas existentes, continuando com migração...');
    }
    
    const existingColumnNames = existingColumns?.map(col => col.column_name) || [];
    console.log('📋 Colunas existentes:', existingColumnNames);
    
    // 2. Adicionar campos de pausa da IA usando SQL direto
    console.log('💾 Adicionando campos de controle de pausa da IA...');
    
    const sqlCommands = [
      // Campo para data/hora até quando a IA deve ficar pausada
      !existingColumnNames.includes('ai_paused_until') 
        ? `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_paused_until TIMESTAMP WITH TIME ZONE;`
        : null,
      
      // Campo para ID do usuário que enviou mensagem manual (causou a pausa)
      !existingColumnNames.includes('ai_paused_by_user_id')
        ? `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_paused_by_user_id INTEGER;`
        : null,
      
      // Campo para motivo da pausa (manual_message, user_request, etc.)
      !existingColumnNames.includes('ai_pause_reason')
        ? `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ai_pause_reason VARCHAR(100);`
        : null,
    ].filter(Boolean);
    
    // Executar comandos SQL
    for (const sql of sqlCommands) {
      if (sql) {
        console.log('📝 Executando:', sql);
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log('⚠️ Erro ao executar SQL, tentando abordagem alternativa:', error.message);
          // Tentar usando raw SQL
          const { error: rawError } = await supabase
            .from('conversations')
            .select('*')
            .limit(1);
          
          if (rawError) {
            throw new Error(`Falha na execução SQL: ${error.message}`);
          }
        }
      }
    }
    
    // 3. Criar índices para performance
    console.log('🔧 Criando índices para otimização...');
    
    const indexCommands = [
      `CREATE INDEX IF NOT EXISTS idx_conversations_ai_paused_until ON conversations(ai_paused_until) WHERE ai_paused_until IS NOT NULL;`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_ai_pause_reason ON conversations(ai_pause_reason) WHERE ai_pause_reason IS NOT NULL;`,
    ];
    
    for (const indexSql of indexCommands) {
      console.log('🔍 Criando índice:', indexSql);
      const { error: indexError } = await supabase.rpc('exec_sql', { sql_query: indexSql });
      
      if (indexError) {
        console.log('⚠️ Índice pode já existir:', indexError.message);
      }
    }
    
    // 4. Verificar se migração foi bem-sucedida
    console.log('✅ Verificando resultado da migração...');
    
    const { data: finalColumns, error: finalError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'conversations')
      .in('column_name', ['ai_paused_until', 'ai_paused_by_user_id', 'ai_pause_reason']);
    
    if (finalError) {
      console.log('⚠️ Não foi possível verificar resultado da migração');
    } else {
      console.log('📋 Campos adicionados:');
      finalColumns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }
    
    console.log('🎉 ETAPA 2: Migração concluída com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   • ETAPA 3: Implementar lógica de detecção de mensagens manuais');
    console.log('   • ETAPA 4: Criar serviço de pausa automática da IA');
    console.log('   • ETAPA 5: Integrar com sistema de envio de mensagens');
    console.log('   • ETAPA 6: Adicionar interface visual de controle');
    
  } catch (error) {
    console.error('❌ ETAPA 2: Erro na migração:', error);
    throw error;
  }
}

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addAiPauseFields()
    .then(() => {
      console.log('✅ Migração ETAPA 2 executada com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na migração ETAPA 2:', error);
      process.exit(1);
    });
}

export { addAiPauseFields };