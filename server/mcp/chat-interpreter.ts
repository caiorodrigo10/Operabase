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

      // Extrair informações de agendamento da mensagem atual
      const extractedInfo = contextManager.extractAppointmentInfo(
        message, 
        context?.pendingAppointment
      );

      // Atualizar contexto com informações extraídas
      if (Object.keys(extractedInfo).length > 0) {
        context = contextManager.updateContext(sessionId, {
          pendingAppointment: extractedInfo
        });
      }

      const systemPrompt = this.buildSystemPrompt();

      // Incluir contexto na conversa se existir
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        { role: 'system', content: systemPrompt }
      ];

      // Adicionar histórico de conversa se existir
      if (context?.conversationHistory && context.conversationHistory.length > 0) {
        const recentHistory = context.conversationHistory.slice(-4); // Últimas 4 mensagens para mais contexto
        recentHistory.forEach(item => {
          messages.push({ role: 'user', content: item.message });
          if (item.action) {
            messages.push({ role: 'assistant', content: `Ação executada: ${item.action}` });
          }
        });
      }

      // Incluir contexto de agendamento pendente se existir
      let contextualMessage = message;
      if (context?.pendingAppointment) {
        const pending = context.pendingAppointment;
        const missingFields = contextManager.validateAppointment(pending);

        if (missingFields.length === 0) {
          contextualMessage += `\n\nCONTEXTO COMPLETO: Nome: ${pending.contact_name}, Data: ${pending.date}, Horário: ${pending.time} - EXECUTAR AGENDAMENTO AGORA!`;
        } else {
          const hasData = Object.entries(pending)
            .filter(([key, value]) => value && key !== 'incomplete_fields')
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          contextualMessage += `\n\nIMPORTANTE: DADOS JÁ COLETADOS [${hasData}]. FALTAM APENAS: ${missingFields.join(', ')}. NÃO PERGUNTE NOVAMENTE OS DADOS QUE JÁ TEMOS!`;
        }
      }

      messages.push({ role: 'user', content: contextualMessage });

      console.log('🧠 OpenAI Request:', {
        sessionId,
        messageLength: message.length,
        hasContext: !!context?.pendingAppointment,
        historySize: context?.conversationHistory?.length || 0
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.1, // Reduzido para mais consistência
        max_tokens: 1000,
        top_p: 0.9
      });

      const responseContent = completion.choices[0]?.message?.content;

      console.log('🤖 OpenAI Response:', responseContent?.substring(0, 200) + '...');

      if (!responseContent) {
        // Fallback para resposta natural
        return {
          success: true,
          data: {
            action: 'chat_response',
            message: 'Desculpe, tive um problema para processar sua mensagem. Pode tentar novamente?',
            sessionId
          }
        };
      }

      // Tentar fazer parse do JSON retornado
      let parsedAction;
      try {
        // Limpar resposta se contiver texto extra
        const cleanedResponse = responseContent.trim();
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;

        parsedAction = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('❌ Parse Error:', parseError);
        console.error('❌ Raw Response:', responseContent);

        // Fallback para resposta conversacional
        return {
          success: true,
          data: {
            action: 'chat_response',
            message: responseContent.replace(/[{}\"]/g, ''),
            sessionId
          }
        };
      }

      // Validar com Zod
      let validatedAction;
      try {
        validatedAction = ActionSchema.parse(parsedAction);
      } catch (zodError) {
        console.error('❌ Zod Validation Error:', zodError);

        // Tentar criar uma ação válida baseada no conteúdo
        if (parsedAction.message || parsedAction.response) {
          return {
            success: true,
            data: {
              action: 'chat_response',
              message: parsedAction.message || parsedAction.response || 'Entendi sua mensagem!',
              sessionId
            }
          };
        }

        return {
          success: false,
          error: 'Formato de resposta inválido da IA'
        };
      }

      // Atualizar contexto conforme a ação
      if (sessionId) {
        if (validatedAction.action === 'create') {
          contextManager.updateContext(sessionId, {
            lastAction: 'create',
            pendingAppointment: validatedAction
          });
        } else if (validatedAction.action === 'clarification') {
          contextManager.addMessage(sessionId, validatedAction.message, 'clarification');
        }
      }

      console.log('✅ Validated Action:', {
        action: validatedAction.action,
        sessionId,
        hasAllData: validatedAction.action === 'create' ? !!(validatedAction.contact_name && validatedAction.date && validatedAction.time) : true
      });

      return {
        success: true,
        data: { ...validatedAction, sessionId }
      };

    } catch (error) {
      console.error('💥 Interpreter Error:', error);

      if (error instanceof z.ZodError) {
        return {
          success: true,
          data: {
            action: 'chat_response',
            message: 'Entendi sua mensagem, mas preciso de mais detalhes. Pode me ajudar?',
            sessionId
          }
        };
      }

      // Fallback final sempre retorna sucesso
      return {
        success: true,
        data: {
          action: 'chat_response',
          message: 'Olá! Como posso ajudar você hoje?',
          sessionId
        }
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

    return `# MARA - Assistente Médico MCP Ultra-Robusto

Você é MARA, assistente médico conversacional integrado via Model Context Protocol (MCP) para agendamento médico. Sua função é interpretar linguagem natural e executar ações estruturadas com máxima confiabilidade.

## OBJETIVO PRINCIPAL
Garantir 100% de sucesso na interpretação e execução de comandos, mesmo com dados incompletos ou ambíguos. NUNCA retornar erro genérico ao usuário.

## CONTEXTO OPERACIONAL FIXO
- Clínica ID: 1 (sempre)
- User ID: 4 (cr@caiorodrigo.com.br)
- Timezone: São Paulo (UTC-3)
- Data atual: ${today.toISOString().split('T')[0]} (${todayWeekday}-feira)
- Amanhã: ${tomorrow.toISOString().split('T')[0]} (${tomorrowWeekday}-feira)

## AÇÕES MCP DISPONÍVEIS

### AGENDAMENTO:
- **create** → Criar consulta (requer: contact_name, date, time)
- **list** → Listar consultas (filtros opcionais)
- **availability** → Verificar horários (requer: date, duration)
- **reschedule** → Reagendar (requer: appointment_id, new_date, new_time)
- **cancel** → Cancelar (requer: appointment_id, reason)

### CONVERSAÇÃO:
- **chat_response** → Resposta natural
- **clarification** → Solicitar dados específicos

## PROTOCOLO DE EXECUÇÃO ROBUSTO
Para CADA mensagem, SEMPRE seguir esta sequência:

1. **INTERPRETAÇÃO DEFENSIVA**
   - Se não entender 100% → chat_response perguntando especificamente
   - Se dados incompletos → clarification listando exatamente o que falta
   - Se ambíguo → chat_response oferecendo opções claras

2. **VALIDAÇÃO PROGRESSIVA**
   - Aceitar dados parciais e armazenar em contexto
   - Nunca descartar informações já coletadas
   - Sempre tentar completar com dados implícitos

3. **EXECUÇÃO GARANTIDA**
   - Se todos os dados obrigatórios estão presentes → executar ação
   - Se faltam dados → clarification específica
   - Se ação não aplicável → chat_response explicativa

## TRATAMENTO DE ERROS OBRIGATÓRIO
NUNCA retornar erro genérico. SEMPRE uma dessas respostas:

**Se interpretação falhou:**
{"action": "chat_response", "message": "Não consegui entender completamente. Você quer [agendar/consultar/cancelar] alguma coisa? Me diga mais detalhes."}

**Se dados incompletos:**
{"action": "clarification", "message": "Para agendar, preciso saber: [listar campos específicos que faltam]. Você pode me passar essas informações?"}

**Se ação não possível:**
{"action": "chat_response", "message": "Entendi que você quer [resumir intenção], mas [explicar limitação específica]. Posso ajudar com [alternativas]?"}

## EXTRAÇÃO INTELIGENTE DE DADOS

**Nomes de pacientes:**
- "Maria Silva", "João Santos" → contact_name
- "para a Maria" → contact_name: "Maria"
- "meu nome é Ana" → contact_name: "Ana"

**Datas contextuais:**
- "hoje" → ${today.toISOString().split('T')[0]}
- "amanhã" → ${tomorrow.toISOString().split('T')[0]}

**Horários flexíveis:**
- "8h", "8:00", "às 8" → "08:00"
- "14h30", "14:30", "duas e meia" → "14:30"
- "manhã" → sugerir horários 08:00-12:00
- "tarde" → sugerir horários 13:00-18:00

## EXEMPLOS DE RESPOSTA OBRIGATÓRIA

**Usuário:** "oi"
**Resposta:** {"action": "chat_response", "message": "Olá! Sou a MARA, sua assistente de agendamento médico. Posso ajudar você a agendar consultas, verificar horários disponíveis, ou consultar agendamentos existentes. Como posso ajudar?"}

**Usuário:** "quero agendar"
**Resposta:** {"action": "clarification", "message": "Perfeito! Para agendar uma consulta, preciso saber: nome do paciente, data preferida e horário. Você pode me passar essas informações?"}

**Usuário:** "Maria amanhã 10h"
**Resposta:** {"action": "create", "contact_name": "Maria", "date": "${tomorrow.toISOString().split('T')[0]}", "time": "10:00", "clinic_id": 1, "user_id": 4}

## REGRAS CRÍTICAS
- NUNCA retorne erro sem explicação específica
- SEMPRE mantenha tom profissional e útil
- SEMPRE ofereça próximos passos claros
- NUNCA assuma dados não fornecidos explicitamente
- SEMPRE confirme antes de executar ações críticas

## VALIDAÇÃO FINAL
Antes de responder, pergunte-se:
- A resposta é clara e específica?
- O usuário sabe exatamente o que fazer em seguida?
- Todos os dados obrigatórios estão presentes ou foram solicitados?
- A ação escolhida faz sentido para a mensagem recebida?

RESPOSTA SEMPRE EM JSON VÁLIDO. ZERO TOLERÂNCIA A ERROS GENÉRICOS.`;
  }
}

export const chatInterpreter = new ChatInterpreter();