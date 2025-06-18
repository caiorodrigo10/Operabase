import { OpenAI } from 'openai';
import { z } from 'zod';
import { contextManager } from './conversation-context';

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

  async interpretMessage(message: string, sessionId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Gerar sessionId se não fornecido
      if (!sessionId) {
        sessionId = contextManager.generateSessionId();
      }

      // Adicionar mensagem ao histórico
      contextManager.addMessage(sessionId, message);

      // Interceptar perguntas sobre data atual
      const dateQuestions = ['que dia', 'qual dia', 'hoje', 'data de hoje', 'dia é hoje', 'dia hoje'];
      if (dateQuestions.some(q => message.toLowerCase().includes(q))) {
        const now = new Date();
        const saoPauloOffset = -3 * 60; // UTC-3 em minutos
        const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
        
        const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
        const todayWeekday = weekdays[saoPauloTime.getDay()];
        
        return {
          success: true,
          data: {
            action: 'chat_response',
            message: `Hoje é ${saoPauloTime.getDate()} de ${months[saoPauloTime.getMonth()]} de ${saoPauloTime.getFullYear()}, ${todayWeekday}-feira.`,
            sessionId
          }
        };
      }

      // Obter contexto existente
      let context = contextManager.getContext(sessionId);
      
      // Extrair informações da mensagem atual
      const extractedInfo = contextManager.extractAppointmentInfo(message, context?.pendingAppointment);
      
      // Atualizar contexto com novas informações
      context = contextManager.updateContext(sessionId, {
        pendingAppointment: extractedInfo,
        lastAction: 'processing'
      });

      // Verificar se temos informações suficientes para criar agendamento
      const missingFields = contextManager.validateAppointment(extractedInfo);
      
      if (missingFields.length === 0) {
        // Temos todas as informações - criar agendamento
        contextManager.addMessage(sessionId, 'Agendamento criado', 'create');
        
        return {
          success: true,
          data: {
            action: 'create',
            ...extractedInfo,
            sessionId
          }
        };
      }

      // Se faltam informações, criar resposta contextual inteligente
      if (missingFields.length > 0) {
        const collectedInfo = [];
        if (extractedInfo.contact_name) collectedInfo.push(`✅ Nome: ${extractedInfo.contact_name}`);
        if (extractedInfo.date) collectedInfo.push(`✅ Data: ${extractedInfo.date}`);
        if (extractedInfo.time) collectedInfo.push(`✅ Horário: ${extractedInfo.time}`);

        const missing = missingFields.map(field => {
          switch(field) {
            case 'nome do paciente': return '🔄 Nome do paciente';
            case 'data': return '🔄 Data da consulta';
            case 'horário': return '🔄 Horário';
            default: return `🔄 ${field}`;
          }
        });

        let responseMessage = '';
        if (collectedInfo.length > 0) {
          responseMessage += `📝 Informações coletadas:\n${collectedInfo.join('\n')}\n\n`;
        }

        if (missingFields.length === 1) {
          responseMessage += `Preciso apenas de mais uma informação: ${missingFields[0]}.`;
        } else {
          responseMessage += `Ainda preciso de: ${missingFields.join(', ')}.`;
        }

        contextManager.addMessage(sessionId, responseMessage, 'clarification');
        
        return {
          success: true,
          data: {
            action: 'clarification',
            message: responseMessage,
            sessionId,
            context: extractedInfo
          }
        };
      }
      
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
    // Usar timezone de São Paulo (UTC-3)
    const now = new Date();
    const saoPauloOffset = -3 * 60; // UTC-3 em minutos
    const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
    
    // Usar diretamente os valores de São Paulo
    const today = saoPauloTime;
    const tomorrow = new Date(saoPauloTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    const todayWeekday = weekdays[today.getDay()];
    const tomorrowWeekday = weekdays[tomorrow.getDay()];
    
    // Calcular próximos dias da semana
    const getNextWeekday = (targetDay: number) => {
      const result = new Date(today);
      const daysUntil = (targetDay - today.getDay() + 7) % 7;
      if (daysUntil === 0) result.setDate(result.getDate() + 7); // Se é hoje, pegar próxima semana
      else result.setDate(result.getDate() + daysUntil);
      return result.toISOString().split('T')[0];
    };

    return `Você é um assistente de agendamento médico amigável e conversacional. Responda de forma natural às mensagens do usuário, mas sempre retorne um JSON com a ação apropriada.

Para mensagens gerais (cumprimentos, perguntas gerais), use o formato "chat_response" para responder conversacionalmente.
Para solicitações específicas de agendamento, use os formatos de ação apropriados.

CONTEXTO:
- clinic_id sempre será 1
- user_id sempre será 4 (usuário de teste)
- Data atual: ${today.toISOString().split('T')[0]} (${todayWeekday}-feira)
- Amanhã: ${tomorrow.toISOString().split('T')[0]} (${tomorrowWeekday}-feira)

CÁLCULO INTELIGENTE DE DATAS:
- Segunda: ${getNextWeekday(1)}
- Terça: ${getNextWeekday(2)}
- Quarta: ${getNextWeekday(3)}
- Quinta: ${getNextWeekday(4)}
- Sexta: ${getNextWeekday(5)}
- Sábado: ${getNextWeekday(6)}
- Domingo: ${getNextWeekday(0)}

FORMATOS DE AÇÃO VÁLIDOS:

0. RESPOSTA CONVERSACIONAL (para cumprimentos, perguntas gerais):
{
  "action": "chat_response",
  "message": "Olá! Tudo bem sim, obrigado! Sou seu assistente de agendamento médico. Como posso ajudar você hoje? Posso agendar, reagendar, cancelar consultas ou verificar a agenda."
}

PARA PERGUNTAS SOBRE DATA ATUAL use EXATAMENTE esta resposta:
{
  "action": "chat_response", 
  "message": "Hoje é ${today.getDate()} de ${['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'][today.getMonth()]} de ${today.getFullYear()}, ${todayWeekday}-feira."
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

5. VERIFICAR DISPONIBILIDADE (apenas para horários livres):
{
  "action": "availability",
  "date": "2025-06-25",
  "duration": 60,
  "working_hours_start": "08:00",
  "working_hours_end": "18:00"
}

IMPORTANTE: Use "list" para mostrar consultas existentes. Use "availability" apenas para horários disponíveis.

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
Resposta: {"action":"create","contact_name":"Maria Silva","date":"${tomorrow.toISOString().split('T')[0]}","time":"10:00","duration":60}

Usuário: "Quais consultas temos hoje?"
Resposta: {"action":"list","date":"${today.toISOString().split('T')[0]}"}

Usuário: "Você tem horário para quinta?"
Resposta: {"action":"availability","date":"${getNextWeekday(4)}","user_id":4,"duration":60,"working_hours_start":"08:00","working_hours_end":"18:00"}

Usuário: "Reagendar a consulta 15 para sexta às 16h"
Resposta: {"action":"reschedule","appointment_id":15,"new_date":"${getNextWeekday(5)}","new_time":"16:00"}

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