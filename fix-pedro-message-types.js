/**
 * Script para corrigir os tipos de mensagem do Pedro Oliveira
 * Atualiza mensagens que deveriam ser de mídia mas estão como texto
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPedroMessageTypes() {
  try {
    console.log('🔍 Verificando mensagens do Pedro Oliveira (conversa ID: 4)...');
    
    // Buscar todas as mensagens da conversa 4 (Pedro Oliveira)
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', 4)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Erro ao buscar mensagens:', fetchError);
      return;
    }

    console.log(`📊 Encontradas ${messages.length} mensagens`);

    // Mensagens que precisam ser corrigidas baseado no conteúdo
    const corrections = [];

    messages.forEach(msg => {
      let newType = msg.message_type;
      let newContent = msg.content;

      // Detectar mensagens de áudio (que têm 🎤)
      if (msg.content && msg.content.includes('🎤')) {
        newType = 'audio';
        // Remover o emoji e deixar apenas o texto descritivo
        newContent = msg.content.replace('🎤 ', '');
      }
      
      // Detectar mensagens de imagem (que têm 📷)
      else if (msg.content && msg.content.includes('📷')) {
        newType = 'image';
        // Remover o emoji e deixar apenas o texto descritivo
        newContent = msg.content.replace('📷 ', '');
      }
      
      // Detectar mensagens de documento (que têm 📎)
      else if (msg.content && msg.content.includes('📎')) {
        newType = 'document';
        // Remover o emoji e deixar apenas o texto descritivo
        newContent = msg.content.replace('📎 ', '');
      }

      // Se houve mudança, adicionar à lista de correções
      if (newType !== msg.message_type || newContent !== msg.content) {
        corrections.push({
          id: msg.id,
          oldType: msg.message_type,
          newType: newType,
          oldContent: msg.content,
          newContent: newContent
        });
      }
    });

    console.log(`🔧 Encontradas ${corrections.length} mensagens para corrigir`);

    if (corrections.length === 0) {
      console.log('✅ Nenhuma correção necessária');
      return;
    }

    // Aplicar as correções
    for (const correction of corrections) {
      console.log(`📝 Corrigindo mensagem ${correction.id}: ${correction.oldType} → ${correction.newType}`);
      
      const { error: updateError } = await supabase
        .from('conversation_messages')
        .update({
          message_type: correction.newType,
          content: correction.newContent
        })
        .eq('id', correction.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar mensagem ${correction.id}:`, updateError);
      } else {
        console.log(`✅ Mensagem ${correction.id} atualizada com sucesso`);
      }
    }

    console.log('🎉 Correções aplicadas com sucesso!');
    
    // Verificar o resultado final
    console.log('\n📊 Resumo final dos tipos de mensagem:');
    const { data: finalMessages } = await supabase
      .from('conversation_messages')
      .select('message_type')
      .eq('conversation_id', 4);

    const typeCounts = finalMessages.reduce((acc, msg) => {
      acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} mensagens`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

fixPedroMessageTypes();