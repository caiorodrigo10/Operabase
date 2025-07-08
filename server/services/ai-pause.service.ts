/**
 * SISTEMA DE PAUSA AUTOMÁTICA DA IA
 * Detecta mensagens manuais de profissionais e pausa IA automaticamente
 * Baseado na implementação do painel espelho
 */

import { createClient } from '@supabase/supabase-js';

export interface AiPauseContext {
  conversationId: string | number;
  clinicId: number;
  senderId: string;
  senderType: 'patient' | 'professional' | 'ai' | 'system';
  deviceType: 'manual' | 'system';
  messageContent: string;
  timestamp: Date;
}

export interface AiPauseResult {
  shouldPause: boolean;
  pausedUntil?: Date;
  pauseReason?: string;
  pausedByUserId?: number;
}

interface LiviaConfiguration {
  off_duration: number;
  off_unit: 'minutes' | 'hours' | 'days';
}

export class AiPauseService {
  private static instance: AiPauseService;
  private supabase: any;

  private constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  public static getInstance(): AiPauseService {
    if (!AiPauseService.instance) {
      AiPauseService.instance = new AiPauseService();
    }
    return AiPauseService.instance;
  }

  /**
   * Detecta se uma mensagem deve pausar a IA
   * Critério: sender_type = 'professional' AND device_type = 'manual' | 'system'
   * PROTEÇÃO: Só aplica pausa automática se IA estiver ativa
   */
  public shouldPauseAi(context: AiPauseContext, currentAiActive?: boolean, currentPauseReason?: string): boolean {
    console.log('🔍 AI PAUSE: Analisando se deve pausar IA...', {
      conversationId: context.conversationId,
      senderType: context.senderType,
      deviceType: context.deviceType,
      senderId: context.senderId,
      currentAiActive,
      currentPauseReason
    });

    // PROTEÇÃO: Se IA foi desativada manualmente, não aplicar pausa automática
    if (currentAiActive === false && currentPauseReason === 'manual') {
      console.log('🚫 AI PAUSE: IA desativada manualmente - não aplicar pausa automática');
      return false;
    }

    // PROTEÇÃO: Só aplicar pausa se IA estiver atualmente ativa
    if (currentAiActive === false) {
      console.log('🚫 AI PAUSE: IA já está inativa - não aplicar pausa automática');
      return false;
    }

    // Regra principal: profissional enviando mensagem (manual OU system)
    const isProfessionalMessage = 
      context.senderType === 'professional' && 
      (context.deviceType === 'manual' || context.deviceType === 'system');

    if (isProfessionalMessage) {
      console.log('✅ AI PAUSE: Mensagem de profissional detectada - IA deve ser pausada', {
        senderType: context.senderType,
        deviceType: context.deviceType,
        trigger: context.deviceType === 'manual' ? 'manual_message' : 'system_web_message'
      });
      return true;
    }

    console.log('⏭️ AI PAUSE: Mensagem não requer pausa da IA', {
      senderType: context.senderType,
      deviceType: context.deviceType,
      reason: context.senderType !== 'professional' ? 'sender_not_professional' : 'device_not_manual_or_system'
    });

    return false;
  }

  /**
   * Calcula por quanto tempo a IA deve ficar pausada
   * Baseado na configuração da clínica (off_duration + off_unit)
   */
  public calculatePauseDuration(
    liviaConfig: LiviaConfiguration,
    currentTime: Date = new Date()
  ): Date {
    const duration = liviaConfig.off_duration || 30; // padrão 30
    const unit = liviaConfig.off_unit || 'minutes'; // padrão minutes

    console.log('⏰ AI PAUSE: Calculando duração da pausa...', {
      duration,
      unit,
      currentTime: currentTime.toISOString()
    });

    const pauseEnd = new Date(currentTime);

    switch (unit) {
      case 'minutes':
        pauseEnd.setMinutes(pauseEnd.getMinutes() + duration);
        break;
      case 'hours':
        pauseEnd.setHours(pauseEnd.getHours() + duration);
        break;
      case 'days':
        pauseEnd.setDate(pauseEnd.getDate() + duration);
        break;
      default:
        // Fallback para minutos
        pauseEnd.setMinutes(pauseEnd.getMinutes() + duration);
        console.log('⚠️ AI PAUSE: Unidade desconhecida, usando minutos como fallback');
    }

    console.log('✅ AI PAUSE: Pausa calculada até:', pauseEnd.toISOString());
    return pauseEnd;
  }

  /**
   * Processa mensagem e retorna resultado da análise de pausa
   * PROTEÇÃO: Recebe estado atual da IA para evitar sobrescrever desativação manual
   */
  public async processMessage(
    context: AiPauseContext,
    liviaConfig: LiviaConfiguration,
    currentAiActive?: boolean,
    currentPauseReason?: string
  ): Promise<AiPauseResult> {
    console.log('🚀 AI PAUSE: Processando mensagem para sistema de pausa da IA', {
      currentAiActive,
      currentPauseReason
    });

    const shouldPause = this.shouldPauseAi(context, currentAiActive, currentPauseReason);

    if (!shouldPause) {
      return {
        shouldPause: false
      };
    }

    // Calcular duração da pausa
    const pausedUntil = this.calculatePauseDuration(liviaConfig);

    // Extrair user_id do sender_id (pode ser numero ou string)
    const pausedByUserId = this.extractUserId(context.senderId);

    const result: AiPauseResult = {
      shouldPause: true,
      pausedUntil,
      pauseReason: 'manual_message',
      pausedByUserId
    };

    console.log('✅ AI PAUSE: Resultado da análise de pausa:', {
      shouldPause: result.shouldPause,
      pausedUntil: result.pausedUntil?.toISOString(),
      pauseReason: result.pauseReason,
      pausedByUserId: result.pausedByUserId
    });

    return result;
  }

  /**
   * Verifica se IA está atualmente pausada
   */
  public isAiCurrentlyPaused(
    aiPausedUntil: Date | null | undefined,
    currentTime: Date = new Date()
  ): boolean {
    if (!aiPausedUntil) {
      return false;
    }

    const isPaused = aiPausedUntil > currentTime;
    
    console.log('🔍 AI PAUSE: Verificando se IA está pausada...', {
      aiPausedUntil: aiPausedUntil.toISOString(),
      currentTime: currentTime.toISOString(),
      isPaused
    });

    return isPaused;
  }

  /**
   * Verifica se uma conversa deve receber resposta da IA
   * Leva em conta tanto ai_active quanto ai_paused_until
   */
  public shouldAiRespond(
    aiActive: boolean,
    aiPausedUntil: Date | null | undefined,
    currentTime: Date = new Date()
  ): boolean {
    // Primeiro verifica se IA está ativa para a conversa
    if (!aiActive) {
      console.log('⏸️ AI PAUSE: IA desativada para esta conversa (ai_active = false)');
      return false;
    }

    // Depois verifica se IA está pausada temporariamente
    const isPaused = this.isAiCurrentlyPaused(aiPausedUntil, currentTime);
    
    if (isPaused) {
      console.log('⏸️ AI PAUSE: IA temporariamente pausada até:', aiPausedUntil?.toISOString());
      return false;
    }

    console.log('✅ AI PAUSE: IA pode responder (ativa e não pausada)');
    return true;
  }

  /**
   * Helper: Extrai user_id numérico do sender_id
   */
  private extractUserId(senderId: string): number | undefined {
    try {
      const numericId = parseInt(senderId, 10);
      return isNaN(numericId) ? undefined : numericId;
    } catch (error) {
      console.log('⚠️ AI PAUSE: Não foi possível extrair user_id do sender_id:', senderId);
      return undefined;
    }
  }

  /**
   * Reseta pausa da IA (por exemplo, quando usuário manda mensagem)
   */
  public resetAiPause(): { aiPausedUntil: null; aiPauseReason: null; aiPausedByUserId: null } {
    console.log('🔄 AI PAUSE: Resetando pausa da IA');
    return {
      aiPausedUntil: null,
      aiPauseReason: null,
      aiPausedByUserId: null
    };
  }

  /**
   * Formata tempo restante de pausa para exibição
   */
  public formatPauseTimeRemaining(
    aiPausedUntil: Date | null | undefined,
    currentTime: Date = new Date()
  ): string | null {
    if (!aiPausedUntil || !this.isAiCurrentlyPaused(aiPausedUntil, currentTime)) {
      return null;
    }

    const diffMs = aiPausedUntil.getTime() - currentTime.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    }

    const diffHours = Math.ceil(diffMinutes / 60);
    return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  }

  /**
   * Middleware de reativação automática - executa a cada 30 segundos
   */
  public async checkAndReactivateExpiredPauses(): Promise<void> {
    try {
      const now = new Date();
      
      // Buscar conversas com pausa expirada (apenas manual_message)
      const { data: expiredPauses, error } = await this.supabase
        .from('conversations')
        .select('id, clinic_id, ai_paused_until, ai_pause_reason')
        .eq('ai_active', false)
        .eq('ai_pause_reason', 'manual_message')
        .lt('ai_paused_until', now.toISOString())
        .not('ai_paused_until', 'is', null);

      if (error) {
        console.error('❌ AI PAUSE: Erro ao buscar pausas expiradas:', error);
        return;
      }

      if (!expiredPauses || expiredPauses.length === 0) {
        return; // Nenhuma pausa expirada
      }

      console.log(`🔄 AI PAUSE: Encontradas ${expiredPauses.length} pausas expiradas para reativação`);

      // Reativar conversas com pausa expirada
      for (const conversation of expiredPauses) {
        const { error: updateError } = await this.supabase
          .from('conversations')
          .update({
            ai_active: true,
            ai_paused_until: null,
            ai_pause_reason: null,
            ai_paused_by_user_id: null,
            updated_at: now.toISOString()
          })
          .eq('id', conversation.id);

        if (updateError) {
          console.error(`❌ AI PAUSE: Erro ao reativar conversa ${conversation.id}:`, updateError);
        } else {
          console.log(`✅ AI PAUSE: IA reativada para conversa ${conversation.id} (pausa expirou)`);
        }
      }

    } catch (error) {
      console.error('❌ AI PAUSE: Erro no middleware de reativação:', error);
    }
  }
}

export const aiPauseService = AiPauseService.getInstance(); 