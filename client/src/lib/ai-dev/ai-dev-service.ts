/**
 * AI Dev Service - Fase 2: Core AI Engine
 * Serviço principal para processamento de comandos com OpenAI
 */

import { BuilderAction, AIProcessResult, CraftJSON } from './types';
import { generateContextualPrompt, validateBuilderAction } from './ai-dev-prompt';

export class AIDevService {
  private apiKey: string | null = null;
  private baseURL = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    // Buscar API key do ambiente ou usar uma configurada
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  /**
   * Configura a API key manualmente
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Verifica se o serviço está configurado
   */
  isConfigured(): boolean {
    return this.apiKey !== null;
  }

  /**
   * Processa um prompt do usuário e retorna a ação a ser executada
   */
  async processPrompt(
    userPrompt: string, 
    currentPageJSON: CraftJSON
  ): Promise<AIProcessResult> {
    const startTime = Date.now();

    try {
      if (!this.isConfigured()) {
        return {
          success: false,
          error: 'OpenAI API key não configurada',
          timestamp: startTime
        };
      }

      // Gerar prompt contextual
      const contextualPrompt = generateContextualPrompt(userPrompt, currentPageJSON);

      // Fazer chamada para OpenAI
      const response = await this.callOpenAI(contextualPrompt);

      // Parse da resposta
      const action = this.parseAIResponse(response);

      // Validar ação
      const validation = validateBuilderAction(action);
      if (!validation.valid) {
        return {
          success: false,
          error: `Ação inválida: ${validation.error}`,
          timestamp: startTime
        };
      }

      return {
        success: true,
        action,
        timestamp: startTime
      };

    } catch (error) {
      console.error('Erro no processamento AI:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: startTime
      };
    }
  }

  /**
   * Faz chamada para a API OpenAI
   */
  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key não configurada');
    }

    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida da OpenAI');
    }

    return data.choices[0].message.content;
  }

  /**
   * Faz parse da resposta JSON da AI
   */
  private parseAIResponse(response: string): BuilderAction {
    try {
      const parsed = JSON.parse(response);
      
      // Garantir que temos uma ação válida
      if (!parsed.action || !parsed.target || !parsed.props || !parsed.reasoning) {
        throw new Error('Resposta AI incompleta');
      }

      return {
        action: parsed.action,
        target: parsed.target,
        component: parsed.component,
        props: parsed.props,
        reasoning: parsed.reasoning,
        parentTarget: parsed.parentTarget
      };

    } catch (error) {
      throw new Error(`Erro ao parsear resposta AI: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  /**
   * Testa a conexão com OpenAI
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isConfigured()) {
        return { success: false, error: 'API key não configurada' };
      }

      const testPrompt = 'Teste de conexão. Responda apenas: {"status": "ok"}';
      const response = await this.callOpenAI(testPrompt);
      
      const parsed = JSON.parse(response);
      if (parsed.status === 'ok') {
        return { success: true };
      }

      return { success: false, error: 'Resposta inesperada' };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de conexão' 
      };
    }
  }

  /**
   * Processa múltiplos comandos em sequência
   */
  async processMultiplePrompts(
    prompts: string[],
    currentPageJSON: CraftJSON
  ): Promise<AIProcessResult[]> {
    const results: AIProcessResult[] = [];
    let workingJSON = currentPageJSON;

    for (const prompt of prompts) {
      const result = await this.processPrompt(prompt, workingJSON);
      results.push(result);

      // Se a ação foi bem-sucedida, simular aplicação no JSON
      // (na integração real, isso seria feito pelo transformer)
      if (result.success && result.action) {
        // Aqui poderíamos aplicar a ação ao workingJSON
        // Para manter a sequência de comandos contextual
      }
    }

    return results;
  }

  /**
   * Gera sugestões baseadas no estado atual da página
   */
  async generateSuggestions(currentPageJSON: CraftJSON): Promise<string[]> {
    try {
      const suggestionPrompt = `
        Baseado no estado atual da página, sugira 3 melhorias simples que o usuário pode fazer.
        
        ESTADO ATUAL: ${JSON.stringify(currentPageJSON, null, 2)}
        
        Retorne apenas um array JSON de strings com sugestões práticas:
        ["sugestão 1", "sugestão 2", "sugestão 3"]
      `;

      const response = await this.callOpenAI(suggestionPrompt);
      const suggestions = JSON.parse(response);

      if (Array.isArray(suggestions)) {
        return suggestions;
      }

      return [];

    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }
}

// Instância singleton do serviço
export const aiDevService = new AIDevService();