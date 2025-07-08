/**
 * Middleware para verificar e reativar AI quando pausa automática expira
 * Conecta ai_paused_until com ai_active para N8N
 */

import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  }
  
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function checkAndReactivateExpiredAiPause() {
  try {
    console.log('🔄 AI PAUSE: Verificando conversas com pausa de IA expirada...');
    
    const supabase = getSupabaseClient();
    
    // Buscar conversas onde IA está pausada mas o tempo já expirou
    // CORREÇÃO: Só reativar pausas automáticas (reason='manual_message'), não manuais (reason='manual')
    const { data: expiredPauses, error } = await supabase
      .from('conversations')
      .select('id, ai_paused_until, ai_active, ai_pause_reason')
      .eq('ai_active', false) // AI está desativada
      .not('ai_paused_until', 'is', null) // Tem pausa configurada
      .eq('ai_pause_reason', 'manual_message') // APENAS pausas automáticas
      .lt('ai_paused_until', new Date().toISOString()); // Pausa já expirou
    
    if (error) {
      console.error('❌ AI PAUSE: Erro ao buscar pausas expiradas:', error);
      return;
    }
    
    if (!expiredPauses || expiredPauses.length === 0) {
      console.log('ℹ️ AI PAUSE: Nenhuma pausa de IA expirada encontrada');
      return;
    }
    
    console.log(`🔄 AI PAUSE: Encontradas ${expiredPauses.length} pausas expiradas para reativar`);
    
    // Reativar IA para conversas com pausa expirada
    for (const conversation of expiredPauses) {
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          ai_active: true, // ✅ Reativar IA para N8N
          ai_paused_until: null,
          ai_pause_reason: null,
          ai_paused_by_user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);
      
      if (updateError) {
        console.error(`❌ AI PAUSE: Erro ao reativar IA para conversa ${conversation.id}:`, updateError);
      } else {
        console.log(`✅ AI PAUSE: IA reativada para conversa ${conversation.id} (pausa expirou)`);
      }
    }
    
  } catch (error) {
    console.error('❌ AI PAUSE: Erro no verificador de pausa de IA:', error);
  }
}

// Executar verificação a cada 30 segundos
export function startAiPauseChecker() {
  console.log('🚀 AI PAUSE: Iniciando verificador automático de pausa de IA...');
  
  // Execução inicial
  checkAndReactivateExpiredAiPause();
  
  // Execução periódica a cada 30 segundos
  setInterval(checkAndReactivateExpiredAiPause, 30000);
}