/**
 * MIDDLEWARE DE REATIVAÇÃO AUTOMÁTICA DA IA
 * Executa a cada 30 segundos verificando pausas expiradas
 * Reativa automaticamente conversas com ai_pause_reason="manual_message"
 * Preserva desativações manuais (ai_pause_reason="manual")
 */

import { AiPauseService } from '../services/ai-pause.service';

export class AiPauseChecker {
  private static instance: AiPauseChecker;
  private intervalId: NodeJS.Timeout | null = null;
  private aiPauseService: AiPauseService;
  private isRunning = false;

  private constructor() {
    this.aiPauseService = AiPauseService.getInstance();
  }

  public static getInstance(): AiPauseChecker {
    if (!AiPauseChecker.instance) {
      AiPauseChecker.instance = new AiPauseChecker();
    }
    return AiPauseChecker.instance;
  }

  /**
   * Inicia o timer de verificação automática
   */
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ AI PAUSE CHECKER: Timer já está rodando');
      return;
    }
    
    console.log('🚀 AI PAUSE CHECKER: Iniciando timer de reativação automática (30s)');
    
    // Executar imediatamente uma vez
    this.checkPauses();
    
    // Configurar timer para executar a cada 30 segundos
    this.intervalId = setInterval(() => {
      this.checkPauses();
    }, 30000); // 30 segundos

    this.isRunning = true;
    console.log('✅ AI PAUSE CHECKER: Timer iniciado com sucesso');
  }

  /**
   * Para o timer de verificação
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    console.log('🛑 AI PAUSE CHECKER: Timer de reativação parado');
  }

  /**
   * Verifica e reativa pausas expiradas
   */
  private async checkPauses(): Promise<void> {
    try {
      console.log('🔍 AI PAUSE CHECKER: Verificando pausas expiradas...');
      await this.aiPauseService.checkAndReactivateExpiredPauses();
  } catch (error) {
      console.error('❌ AI PAUSE CHECKER: Erro na verificação de pausas:', error);
  }
}

  /**
   * Status do timer
   */
  public getStatus(): { isRunning: boolean; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      intervalMs: 30000
    };
  }
}

/**
 * Função para inicializar o middleware no servidor
 */
export function initializeAiPauseChecker(): void {
  const checker = AiPauseChecker.getInstance();
  checker.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('🔄 AI PAUSE CHECKER: Parando timer devido a SIGINT');
    checker.stop();
  });

  process.on('SIGTERM', () => {
    console.log('🔄 AI PAUSE CHECKER: Parando timer devido a SIGTERM');
    checker.stop();
  });
}