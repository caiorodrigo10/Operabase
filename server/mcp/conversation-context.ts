import { z } from 'zod';

// Schema para armazenar contexto da conversa
export const ConversationContextSchema = z.object({
  sessionId: z.string(),
  pendingAppointment: z.object({
    contact_name: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    duration: z.number().optional(),
    doctor_name: z.string().optional(),
    specialty: z.string().optional(),
    appointment_type: z.string().optional(),
    incomplete_fields: z.array(z.string()).optional()
  }).optional(),
  lastAction: z.string().optional(),
  conversationHistory: z.array(z.object({
    message: z.string(),
    timestamp: z.number(),
    action: z.string().optional()
  })).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type ConversationContext = z.infer<typeof ConversationContextSchema>;

// Gerenciador de contexto em memória (pode ser expandido para Redis/DB)
class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly CONTEXT_TTL = 30 * 60 * 1000; // 30 minutos

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getContext(sessionId: string): ConversationContext | null {
    const context = this.contexts.get(sessionId);
    if (!context) return null;

    // Verificar se expirou
    if (Date.now() - context.updatedAt > this.CONTEXT_TTL) {
      this.contexts.delete(sessionId);
      return null;
    }

    return context;
  }

  updateContext(sessionId: string, updates: Partial<ConversationContext>): ConversationContext {
    const existing = this.getContext(sessionId) || {
      sessionId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updated = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    this.contexts.set(sessionId, updated);
    return updated;
  }

  addMessage(sessionId: string, message: string, action?: string): void {
    const context = this.getContext(sessionId) || {
      sessionId,
      conversationHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const history = context.conversationHistory || [];
    history.push({
      message,
      timestamp: Date.now(),
      action
    });

    // Manter apenas últimas 10 mensagens
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    this.updateContext(sessionId, {
      conversationHistory: history
    });
  }

  extractAppointmentInfo(message: string, existing?: any): any {
    const appointment = { ...existing } || {}; // ✅ Preservar dados existentes
    const lowerMsg = message.toLowerCase();

    // Extrair nome do paciente (padrões mais específicos)
    if (!appointment.contact_name) { // ✅ Só extrair se ainda não temos
      const namePatterns = [
        /nome\s+é\s+(.+?)$/i,
        /nome\s+do\s+paciente\s+é\s+(.+)/i,
        /paciente\s+([A-Za-záàâãäçéèêëíìîïóòôõöúùûü\s]{3,})/i,
        /(?:agendar|marcar).*?(?:para|pro)\s+([A-Za-záàâãäçéèêëíìîïóòôõöúùûü\s]{3,})/i,
        /^([A-Za-záàâãäçéèêëíìîïóòôõöúùûü]+\s+[A-Za-záàâãäçéèêëíìîïóòôõöúùûü]+)$/i // ✅ Nome isolado
      ];

      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim();
          const cleanName = name.replace(/\s+(consulta|agendamento|marcação).*$/i, '');
          const excludedWords = ['marcar', 'agendar', 'amanhã', 'hoje', 'horário', 'para as', 'às'];
          if (cleanName.length > 2 && !excludedWords.some(word => cleanName.toLowerCase().includes(word))) {
            appointment.contact_name = cleanName;
            break;
          }
        }
      }
    }

    // Extrair data (preservar se já existe)
    if (!appointment.date) { // ✅ Só extrair se ainda não temos
      if (lowerMsg.includes('amanhã') || lowerMsg.includes('amanha')) {
        const now = new Date();
        const saoPauloOffset = -3 * 60;
        const saoPauloTime = new Date(now.getTime() + saoPauloOffset * 60000);
        const tomorrow = new Date(saoPauloTime);
        tomorrow.setDate(tomorrow.getDate() + 1);
        appointment.date = tomorrow.toISOString().split('T')[0];
      }
      
      // ✅ Extrair datas específicas (19 de junho, 19/06, etc.)
      const datePatterns = [
        /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/i,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/
      ];
      
      for (const pattern of datePatterns) {
        const match = message.match(pattern);
        if (match) {
          if (pattern.source.includes('de')) {
            // Formato: "19 de junho de 2025"
            const day = parseInt(match[1]);
            const monthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
            const month = monthNames.indexOf(match[2].toLowerCase()) + 1;
            const year = parseInt(match[3]);
            appointment.date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          } else {
            // Outros formatos
            appointment.date = match[0];
          }
          break;
        }
      }
    }

    // Extrair horário
    const timePatterns = [
      /(?:às\s+)?(\d{1,2})h(?:(\d{2}))?/i,
      /(?:às\s+)?(\d{1,2}):(\d{2})/i,
      /(?:às\s+)?(\d{1,2})\s*(?:horas?|h)/i,
      /marcar.*?(?:às\s+)?(\d{1,2})h/i,
      /para.*?(?:às\s+)?(\d{1,2})h/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        
        if (hour >= 6 && hour <= 22) { // Horário comercial razoável
          appointment.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          break;
        }
      }
    }

    // Extrair tipo de consulta
    if (lowerMsg.includes('consulta') && !appointment.appointment_type) {
      appointment.appointment_type = 'consulta';
    }

    return appointment;
  }

  validateAppointment(appointment: any): string[] {
    const missing = [];
    
    if (!appointment.contact_name) missing.push('nome do paciente');
    if (!appointment.date) missing.push('data');
    if (!appointment.time) missing.push('horário');
    
    return missing;
  }

  clearContext(sessionId: string): void {
    this.contexts.delete(sessionId);
  }

  // Cleanup de contextos expirados
  cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];
    
    this.contexts.forEach((context, sessionId) => {
      if (now - context.updatedAt > this.CONTEXT_TTL) {
        entriesToDelete.push(sessionId);
      }
    });
    
    entriesToDelete.forEach(sessionId => {
      this.contexts.delete(sessionId);
    });
  }
}

export const contextManager = new ConversationContextManager();

// Executar cleanup a cada 5 minutos
setInterval(() => {
  contextManager.cleanup();
}, 5 * 60 * 1000);