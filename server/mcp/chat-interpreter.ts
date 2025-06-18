import { OpenAI } from 'openai';
import { z } from 'zod';

// Schema para validar as ações interpretadas
const ActionSchema = z.union([
  z.object({
    action: z.literal('chat_response'),
    message: z.string()
  }),
  z.object({
    action: z.literal('create'),
    contact_name: z.string(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    duration: z.number().optional().default(60),
    doctor_name: z.string().optional(),
    specialty: z.string().optional(),
    appointment_type: z.string().optional()
  }),
  z.object({
    action: z.literal('list'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.string().optional(),
    user_id: z.number().optional()
  }),
  z.object({
    action: z.literal('reschedule'),
    appointment_id: z.number(),
    new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    new_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    duration: z.number().optional()
  }),
  z.object({
    action: z.literal('cancel'),
    appointment_id: z.number(),
    cancelled_by: z.enum(['paciente', 'dentista']).optional().default('dentista'),
    reason: z.string().optional()
  }),
  z.object({
    action: z.literal('availability'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    user_id: z.number().optional().default(4),
    duration: z.number().optional().default(60),
    working_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional().default('08:00'),
    working_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional().default('18:00')
  }),
  z.object({
    action: z.literal('clarification'),
    message: z.string()
  })
]);

export class ChatInterpreter {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurado');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async interpretMessage(message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 500
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

      return {
        success: true,
        data: validatedAction
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
    return `Você é um assistente de agendamento médico amigável e conversacional. Responda de forma natural às mensagens do usuário, mas sempre retorne um JSON com a ação apropriada.

Para mensagens gerais (cumprimentos, perguntas gerais), use o formato "chat_response" para responder conversacionalmente.
Para solicitações específicas de agendamento, use os formatos de ação apropriados.

CONTEXTO:
- clinic_id sempre será 1
- user_id sempre será 4 (usuário de teste)
- Data atual: ${new Date().toISOString().split('T')[0]}

FORMATOS DE AÇÃO VÁLIDOS:

0. RESPOSTA CONVERSACIONAL (para cumprimentos, perguntas gerais):
{
  "action": "chat_response",
  "message": "Olá! Tudo bem sim, obrigado! Sou seu assistente de agendamento médico. Como posso ajudar você hoje? Posso agendar, reagendar, cancelar consultas ou verificar a agenda."
}

1. CRIAR CONSULTA:
{
  "action": "create",
  "contact_name": "Nome do Paciente",
  "date": "2025-06-25",
  "time": "14:00",
  "duration": 60,
  "doctor_name": "Dr. Silva",
  "specialty": "ortodontia",
  "appointment_type": "consulta"
}

2. LISTAR CONSULTAS:
{
  "action": "list",
  "date": "2025-06-25"
}
OU para período:
{
  "action": "list",
  "start_date": "2025-06-25",
  "end_date": "2025-06-30"
}

3. REAGENDAR:
{
  "action": "reschedule",
  "appointment_id": 123,
  "new_date": "2025-06-26",
  "new_time": "15:30"
}

4. CANCELAR:
{
  "action": "cancel",
  "appointment_id": 123,
  "cancelled_by": "dentista",
  "reason": "Motivo do cancelamento"
}

5. VERIFICAR DISPONIBILIDADE:
{
  "action": "availability",
  "date": "2025-06-25",
  "duration": 60,
  "working_hours_start": "08:00",
  "working_hours_end": "18:00"
}

6. SOLICITAR CLARIFICAÇÃO:
{
  "action": "clarification",
  "message": "Preciso de mais informações. Qual o nome do paciente?"
}

REGRAS IMPORTANTES:
- Sempre use formato de data YYYY-MM-DD
- Sempre use formato de hora HH:MM
- Para "hoje", use ${new Date().toISOString().split('T')[0]}
- Para "amanhã", use ${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}
- Se informações essenciais estiverem faltando, use action "clarification"
- Interprete linguagem natural: "manhã" = 09:00, "tarde" = 14:00, "noite" = 19:00
- Para reagendamento sem ID específico, solicite clarificação

EXEMPLOS:

Usuário: "Agendar consulta para Maria Silva amanhã às 10h"
Resposta: {"action":"create","contact_name":"Maria Silva","date":"${new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]}","time":"10:00","duration":60}

Usuário: "Quais consultas temos hoje?"
Resposta: {"action":"list","date":"${new Date().toISOString().split('T')[0]}"}

Usuário: "Reagendar a consulta 15 para sexta às 16h"
Resposta: {"action":"reschedule","appointment_id":15,"new_date":"2025-06-27","new_time":"16:00"}

Usuário: "Cancelar consulta 20"
Resposta: {"action":"cancel","appointment_id":20,"cancelled_by":"dentista"}

RETORNE APENAS O JSON, SEM EXPLICAÇÕES ADICIONAIS.`;
  }

  // Método auxiliar para normalizar datas relativas
  private normalizeDateExpression(dateStr: string): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (dateStr.toLowerCase()) {
      case 'hoje':
        return today.toISOString().split('T')[0];
      case 'amanhã':
      case 'amanha':
        return tomorrow.toISOString().split('T')[0];
      default:
        return dateStr;
    }
  }

  // Método auxiliar para normalizar expressões de horário
  private normalizeTimeExpression(timeStr: string): string {
    const timeMap: { [key: string]: string } = {
      'manhã': '09:00',
      'manha': '09:00',
      'tarde': '14:00',
      'noite': '19:00',
      'meio-dia': '12:00',
      'meio dia': '12:00'
    };

    return timeMap[timeStr.toLowerCase()] || timeStr;
  }
}

export const chatInterpreter = new ChatInterpreter();