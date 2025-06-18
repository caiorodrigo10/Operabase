import OpenAI from 'openai';
import { z } from 'zod';
import { contextManager } from './conversation-context';

// Schema de validação para as ações do MCP
const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('chat_response'),
    message: z.string()
  }),
  z.object({
    action: z.literal('create'),
    contact_name: z.string(),
    date: z.string(),
    time: z.string(),
    duration: z.number().default(60),
    doctor_name: z.string().optional(),
    specialty: z.string().optional(),
    appointment_type: z.string().default('consulta'),
    clinic_id: z.number().default(1),
    user_id: z.number().default(4)
  }),
  z.object({
    action: z.literal('list'),
    date: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    clinic_id: z.number().default(1),
    user_id: z.number().default(4)
  }),
  z.object({
    action: z.literal('availability'),
    date: z.string(),
    duration: z.number().default(60),
    clinic_id: z.number().default(1)
  }),
  z.object({
    action: z.literal('reschedule'),
    appointment_id: z.number(),
    new_date: z.string(),
    new_time: z.string(),
    clinic_id: z.number().default(1),
    user_id: z.number().default(4)
  }),
  z.object({
    action: z.literal('cancel'),
    appointment_id: z.number(),
    reason: z.string().optional(),
    clinic_id: z.number().default(1),
    user_id: z.number().default(4)
  }),
  z.object({
    action: z.literal('clarification'),
    message: z.string(),
    context: z.any().optional()
  })
]);

export class ChatInterpreter {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async interpretMessage(message: string, sessionId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Gerar sessionId se não fornecido
      if (!sessionId) {
        sessionId = contextManager.generateSessionId();
      }

      // Adicionar mensagem ao histórico
      contextManager.addMessage(sessionId, message);

      // Obter contexto existente para incluir no prompt
      let context = contextManager.getContext(sessionId);
      
      const systemPrompt = this.buildSystemPrompt();
      
      // Incluir contexto na conversa se existir
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        { role: 'system', content: systemPrompt }
      ];

      // Adicionar histórico de conversa se existir
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-3); // Últimas 3 mensagens
        recentHistory.forEach(item => {
          messages.push({ role: 'user', content: item.message });
          if (item.action) {
            messages.push({ role: 'assistant', content: `{"action": "${item.action}"}` });
          }
        });
      }

      messages.push({ role: 'user', content: message });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.2,
        max_tokens: 800
      });

      const responseContent = completion.choices[0]?.message?.content;
      
      if (!responseContent) {
        return {
          success: false,
          error: 'Não foi possível interpretar a mensagem'
        };
      }

      // Tentar fazer parse do JSON retornado
      let parsedAction;
      try {
        parsedAction = JSON.parse(responseContent);
      } catch (parseError) {
        return {
          success: false,
          error: 'Resposta da IA não está em formato JSON válido'
        };
      }

      // Validar com Zod
      const validatedAction = ActionSchema.parse(parsedAction);

      // Atualizar contexto se necessário
      if (sessionId && (validatedAction.action === 'create' || validatedAction.action === 'clarification')) {
        contextManager.updateContext(sessionId, {
          lastAction: validatedAction.action,
          pendingAppointment: validatedAction.action === 'create' ? validatedAction : undefined
        });
      }

      return {
        success: true,
        data: { ...validatedAction, sessionId }
      };

    } catch (error) {
      console.error('Erro ao interpretar mensagem:', error);
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Formato de ação inválido interpretado pela IA'
        };
      }

      return {
        success: false,
        error: 'Erro interno ao processar mensagem'
      };
    }
  }

  private buildSystemPrompt(): string {
    const now = new Date();
    const saoPauloOffset = -3 * 60;
    const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
    
    const today = saoPauloTime;
    const tomorrow = new Date(saoPauloTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const todayWeekday = weekdays[today.getDay()];
    const tomorrowWeekday = weekdays[tomorrow.getDay()];

    return `# MARA - Assistente MCP para Agendamento Médico

Você é MARA, um agente de teste técnico para validar integração entre linguagem natural e execução de comandos MCP no sistema de agendamento médico.

## CONTEXTO OPERACIONAL
- Data atual: ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()} (${todayWeekday}-feira)
- Amanhã: ${tomorrow.getDate()} de ${months[tomorrow.getMonth()]} de ${tomorrow.getFullYear()} (${tomorrowWeekday}-feira)
- Timezone: São Paulo (UTC-3)
- Clínica ID: 1 (fixo)
- User ID: 4 (cr@caiorodrigo.com.br)

## AÇÕES MCP DISPONÍVEIS

### AGENDAMENTO:
- **create** → Agendar nova consulta (requer: contact_name, date, time)
- **list** → Listar consultas (opcional: date, start_date, end_date)  
- **availability** → Verificar horários livres (requer: date, duration)
- **reschedule** → Reagendar consulta (requer: appointment_id, new_date, new_time)
- **cancel** → Cancelar consulta (requer: appointment_id)

### CONVERSAÇÃO:
- **chat_response** → Resposta natural sem executar ação
- **clarification** → Solicitar dados adicionais

## PROTOCOLO DE EXECUÇÃO
Para cada mensagem:

1. **Interpretar intenção** via NLP
2. **Selecionar ação MCP** correspondente
3. **Validar parâmetros obrigatórios**:
   - create: contact_name, date, time, clinic_id=1, user_id=4
   - list: clinic_id=1, user_id=4 (filtros opcionais)
   - availability: date, duration, clinic_id=1
   - reschedule: appointment_id, new_date, new_time, clinic_id=1
   - cancel: appointment_id, clinic_id=1, user_id=4
4. **Se dados incompletos** → clarification
5. **Se válido** → executar ação
6. **Se conversacional** → chat_response

## INTERPRETAÇÃO AUTOMÁTICA:
- "8h", "8:00", "às 8" → "08:00"
- "hoje", "agora" → ${today.toISOString().split('T')[0]}
- "amanhã" → ${tomorrow.toISOString().split('T')[0]}

## RESTRIÇÕES
- Uma ação por mensagem
- Apenas ações listadas acima
- Validar antes de executar
- Ser direto e previsível
- Não inventar funcionalidades

## EXEMPLOS:
**Usuário:** "Agendar Maria Silva amanhã 10h"
**Você:** {"action": "create", "contact_name": "Maria Silva", "date": "${tomorrow.toISOString().split('T')[0]}", "time": "10:00", "clinic_id": 1, "user_id": 4}

**Usuário:** "Oi, como você está?"
**Você:** {"action": "chat_response", "message": "Olá! Sou a MARA, assistente de agendamento médico. Como posso ajudar?"}

SISTEMA SIMPLES, LINEAR, SEM AMBIGUIDADE. UMA INTENÇÃO POR VEZ.`;
  }
}

export const chatInterpreter = new ChatInterpreter();