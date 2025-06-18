import { useState } from 'react';

interface MCPChatResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface MCPAction {
  action: string;
  [key: string]: any;
}

export function useMCPChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string): Promise<MCPChatResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      // Primeiro, interpretar a mensagem com OpenAI
      const interpretResponse = await fetch('/api/mcp/chat/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!interpretResponse.ok) {
        throw new Error('Erro ao interpretar mensagem');
      }

      const interpretation = await interpretResponse.json();
      
      if (!interpretation.success) {
        return {
          success: false,
          message: interpretation.error || 'Não foi possível interpretar sua mensagem.'
        };
      }

      const action: MCPAction = interpretation.data;

      // Executar a ação interpretada
      return await executeAction(action);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      return {
        success: false,
        message: 'Desculpe, ocorreu um erro ao processar sua mensagem.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (action: MCPAction): Promise<MCPChatResponse> => {
    try {
      switch (action.action) {
        case 'create':
          return await createAppointment(action);
        case 'list':
          return await listAppointments(action);
        case 'reschedule':
          return await rescheduleAppointment(action);
        case 'cancel':
          return await cancelAppointment(action);
        case 'availability':
          return await checkAvailability(action);
        default:
          return {
            success: false,
            message: 'Não entendi o que você quer fazer. Pode reformular sua mensagem?'
          };
      }
    } catch (err) {
      return {
        success: false,
        message: 'Erro ao executar a ação solicitada.'
      };
    }
  };

  const createAppointment = async (action: MCPAction): Promise<MCPChatResponse> => {
    // Primeiro verificar se o contato existe, se não, criar
    let contactId = action.contact_id;
    
    if (!contactId && action.contact_name) {
      const contactResult = await findOrCreateContact(action.contact_name);
      if (!contactResult.success) {
        return contactResult;
      }
      contactId = contactResult.data.contact_id;
    }

    const payload = {
      contact_id: contactId,
      clinic_id: 1, // Hardcoded conforme especificação
      user_id: 4,   // Hardcoded para usuário de teste
      scheduled_date: action.date,
      scheduled_time: action.time,
      duration_minutes: action.duration || 60,
      status: 'agendada',
      doctor_name: action.doctor_name,
      specialty: action.specialty,
      appointment_type: action.appointment_type || 'consulta'
    };

    const response = await fetch('/api/mcp/appointments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: `✅ Consulta agendada com sucesso para ${action.contact_name} no dia ${action.date} às ${action.time}. ID do agendamento: #${result.appointment_id}`,
        data: result.data
      };
    } else {
      // Tratar conflitos específicos
      if (result.conflicts && result.conflicts.length > 0) {
        let message = `❌ Conflito de horário detectado. Já existe uma consulta às ${action.time}.`;
        
        if (result.next_available_slots && result.next_available_slots.length > 0) {
          const slots = result.next_available_slots.slice(0, 3).map((slot: any) => slot.time).join(', ');
          message += `\n\nHorários disponíveis: ${slots}`;
        }
        
        return {
          success: false,
          message
        };
      }

      return {
        success: false,
        message: result.error || 'Erro ao criar agendamento.'
      };
    }
  };

  const listAppointments = async (action: MCPAction): Promise<MCPChatResponse> => {
    const payload = {
      clinic_id: 1,
      filters: {
        startDate: action.date || action.start_date,
        endDate: action.end_date || action.date,
        status: action.status,
        userId: action.user_id
      }
    };

    const response = await fetch('/api/mcp/appointments/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          message: 'Nenhuma consulta encontrada para o período especificado.'
        };
      }

      let message = `📅 Consultas encontradas:\n\n`;
      
      result.data.forEach((appointment: any) => {
        const date = new Date(appointment.scheduled_date);
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString('pt-BR');
        
        message += `• ${timeStr} - ${appointment.contact_name || 'Nome não informado'}`;
        if (appointment.doctor_name) {
          message += ` (Dr. ${appointment.doctor_name})`;
        }
        message += `\n`;
      });

      return {
        success: true,
        message,
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.error || 'Erro ao buscar consultas.'
      };
    }
  };

  const rescheduleAppointment = async (action: MCPAction): Promise<MCPChatResponse> => {
    const payload = {
      clinic_id: 1,
      new_date: action.new_date || action.date,
      new_time: action.new_time || action.time,
      duration_minutes: action.duration || 60
    };

    const response = await fetch(`/api/mcp/appointments/${action.appointment_id}/reschedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: `✅ Consulta reagendada com sucesso para ${action.new_date || action.date} às ${action.new_time || action.time}.`,
        data: result.data
      };
    } else {
      if (result.conflicts && result.conflicts.length > 0) {
        let message = `❌ Conflito de horário. Já existe uma consulta no novo horário.`;
        
        if (result.next_available_slots && result.next_available_slots.length > 0) {
          const slots = result.next_available_slots.slice(0, 3).map((slot: any) => slot.time).join(', ');
          message += `\n\nHorários disponíveis: ${slots}`;
        }
        
        return {
          success: false,
          message
        };
      }

      return {
        success: false,
        message: result.error || 'Erro ao reagendar consulta.'
      };
    }
  };

  const cancelAppointment = async (action: MCPAction): Promise<MCPChatResponse> => {
    const payload = {
      clinic_id: 1,
      cancelled_by: action.cancelled_by || 'dentista',
      reason: action.reason || 'Cancelamento via chat'
    };

    const response = await fetch(`/api/mcp/appointments/${action.appointment_id}/cancel`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: `✅ Consulta cancelada com sucesso. ${action.reason ? `Motivo: ${action.reason}` : ''}`,
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.error || 'Erro ao cancelar consulta.'
      };
    }
  };

  const checkAvailability = async (action: MCPAction): Promise<MCPChatResponse> => {
    const payload = {
      clinic_id: 1,
      user_id: action.user_id || 4,
      date: action.date,
      duration_minutes: action.duration || 60,
      working_hours_start: action.working_hours_start || '08:00',
      working_hours_end: action.working_hours_end || '18:00'
    };

    const response = await fetch('/api/mcp/appointments/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      const availableSlots = result.data.available_slots || [];
      
      if (availableSlots.length === 0) {
        return {
          success: true,
          message: `❌ Não há horários disponíveis para ${action.date}.`
        };
      }

      let message = `📅 Horários disponíveis para ${action.date}:\n\n`;
      
      availableSlots.slice(0, 10).forEach((slot: any) => {
        message += `• ${slot.time}\n`;
      });

      if (availableSlots.length > 10) {
        message += `\n... e mais ${availableSlots.length - 10} horários.`;
      }

      return {
        success: true,
        message,
        data: result.data
      };
    } else {
      return {
        success: false,
        message: result.error || 'Erro ao verificar disponibilidade.'
      };
    }
  };

  const findOrCreateContact = async (contactName: string): Promise<MCPChatResponse> => {
    // Buscar contato existente primeiro
    const searchResponse = await fetch('/api/contacts/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clinic_id: 1,
        query: contactName
      }),
    });

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json();
      
      if (searchResult.length > 0) {
        return {
          success: true,
          message: 'Contato encontrado',
          data: { contact_id: searchResult[0].id }
        };
      }
    }

    // Se não encontrou, criar novo contato
    const createResponse = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clinic_id: 1,
        name: contactName,
        phone: '', // Será solicitado posteriormente se necessário
        email: ''
      }),
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      return {
        success: true,
        message: 'Contato criado',
        data: { contact_id: createResult.id }
      };
    }

    return {
      success: false,
      message: 'Erro ao encontrar ou criar contato.'
    };
  };

  return {
    sendMessage,
    isLoading,
    error,
    setError
  };
}