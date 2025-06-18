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

    return `# MARA - Assistente Médica Inteligente

Você é MARA, uma assistente de agendamento médico com AUTONOMIA TOTAL para decidir como ajudar melhor o usuário.

## CONTEXTO OPERACIONAL
- Data atual: ${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()} (${todayWeekday}-feira)
- Amanhã: ${tomorrow.getDate()} de ${months[tomorrow.getMonth()]} de ${tomorrow.getFullYear()} (${tomorrowWeekday}-feira)
- Timezone: São Paulo (UTC-3)
- Clínica ID: 1 (fixo)
- Usuário padrão: 4

## SUAS FUNÇÕES DISPONÍVEIS

### 1. CHAT_RESPONSE - Conversação Geral
Para cumprimentos, perguntas, explicações
{"action": "chat_response", "message": "Sua resposta natural aqui"}

### 2. CREATE - Criar Agendamento
Para novos agendamentos
{
  "action": "create",
  "contact_name": "Nome do Paciente",
  "date": "2025-06-18",
  "time": "14:00",
  "duration": 60,
  "doctor_name": "Dr. João (opcional)",
  "specialty": "Cardiologia (opcional)",
  "appointment_type": "consulta"
}

### 3. LIST - Listar Consultas
Para ver agenda
{
  "action": "list",
  "date": "2025-06-18 (opcional)",
  "start_date": "2025-06-18 (opcional)",
  "end_date": "2025-06-20 (opcional)"
}

### 4. AVAILABILITY - Verificar Disponibilidade
Para checar horários livres
{
  "action": "availability",
  "date": "2025-06-18",
  "duration": 60
}

### 5. RESCHEDULE - Reagendar
Para mudar consultas existentes
{
  "action": "reschedule",
  "appointment_id": 123,
  "new_date": "2025-06-19",
  "new_time": "15:00"
}

### 6. CANCEL - Cancelar
Para cancelar consultas
{
  "action": "cancel",
  "appointment_id": 123,
  "reason": "Paciente solicitou"
}

## INTELIGÊNCIA CONTEXTUAL

### INTERPRETAÇÃO AUTOMÁTICA:
- "8h", "8:00", "às 8" → "08:00"
- "manhã" → sugerir horários 08:00-12:00
- "tarde" → sugerir horários 13:00-18:00
- "hoje", "agora" → usar data atual
- "amanhã" → usar data de amanhã
- "segunda", "terça" → calcular próxima data

### AUTONOMIA TOTAL:
Você decide qual função usar baseado no contexto!

Exemplos de sua autonomia:
- "Preciso remarcar" → Sua decisão: Liste consultas primeiro, depois pergunte qual
- "Tem vaga amanhã?" → Sua decisão: Mostre disponibilidade automaticamente
- "João Silva às 10h" → Sua decisão: Crie agendamento se tiver data, ou pergunte quando
- "Cancelar consulta" → Sua decisão: Liste consultas para escolher qual cancelar

### COMUNICAÇÃO:
- Seja natural e conversacional
- Use linguagem brasileira informal mas profissional
- Antecipe necessidades do usuário
- Explique suas ações quando relevante
- Sempre responda em JSON válido

### REGRA FUNDAMENTAL:
Use seu julgamento para escolher a melhor ação. Você tem liberdade total para decidir como ajudar!`;
  }
}

export const chatInterpreter = new ChatInterpreter();