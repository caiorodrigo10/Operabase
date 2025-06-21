import { Conversation, Message, SystemEvent, TimelineItem, PatientInfo } from '@/types/conversations';

export const mockConversations: Conversation[] = [
  {
    id: 1,
    patient_name: "Maria Silva",
    patient_avatar: undefined,
    last_message: "Gostaria de remarcar minha consulta para a próxima semana",
    timestamp: "14:30",
    unread_count: 2,
    status: 'active',
    ai_active: true,
    has_pending_appointment: true
  },
  {
    id: 2,
    patient_name: "João Santos",
    patient_avatar: undefined,
    last_message: "Obrigado pelo atendimento",
    timestamp: "12:15",
    unread_count: 0,
    status: 'active',
    ai_active: false,
    has_pending_appointment: false
  },
  {
    id: 3,
    patient_name: "Ana Costa",
    patient_avatar: undefined,
    last_message: "Bom dia, doutora!",
    timestamp: "10:45",
    unread_count: 1,
    status: 'active',
    ai_active: false,
    has_pending_appointment: false
  },
  {
    id: 4,
    patient_name: "Carlos Oliveira",
    patient_avatar: undefined,
    last_message: "Preciso de um atestado médico",
    timestamp: "09:30",
    unread_count: 0,
    status: 'active',
    ai_active: true,
    has_pending_appointment: false
  },
  {
    id: 5,
    patient_name: "Patricia Lima",
    patient_avatar: undefined,
    last_message: "Consulta confirmada para amanhã",
    timestamp: "08:15",
    unread_count: 0,
    status: 'active',
    ai_active: false,
    has_pending_appointment: true
  }
];

export const mockMessages: Message[] = [
  {
    id: 1,
    conversation_id: 1,
    type: 'received',
    content: "Olá! Gostaria de remarcar minha consulta.",
    timestamp: "14:25",
    sender_name: "Maria Silva"
  },
  {
    id: 2,
    conversation_id: 1,
    type: 'sent_system',
    content: "Claro! Vou verificar os horários disponíveis.",
    timestamp: "14:26",
    sender_name: "Sistema"
  },
  {
    id: 3,
    conversation_id: 1,
    type: 'sent_ai',
    content: "Temos disponibilidade na terça às 15h. Confirma?",
    timestamp: "14:27",
    sender_name: "IA"
  },
  {
    id: 4,
    conversation_id: 1,
    type: 'received',
    content: "Perfeito! Pode agendar para terça às 15h.",
    timestamp: "14:28",
    sender_name: "Maria Silva"
  },
  {
    id: 5,
    conversation_id: 1,
    type: 'sent_whatsapp',
    content: "Consulta agendada com sucesso! Você receberá uma confirmação em breve.",
    timestamp: "14:29",
    sender_name: "Dr. João"
  }
];

export const mockSystemEvents: SystemEvent[] = [
  {
    id: 1,
    conversation_id: 1,
    type: 'availability_check',
    content: "IA consultou horários disponíveis",
    timestamp: "14:26"
  },
  {
    id: 2,
    conversation_id: 1,
    type: 'appointment_created',
    content: "Consulta agendada: 25/06 às 15:00 - Dra. Silva",
    timestamp: "14:28",
    metadata: {
      appointment_date: "25/06/2025",
      appointment_time: "15:00",
      doctor_name: "Dra. Silva"
    }
  },
  {
    id: 3,
    conversation_id: 1,
    type: 'webhook_executed',
    content: "Sistema executou: Confirmação de Agendamento",
    timestamp: "14:29",
    metadata: {
      webhook_name: "Confirmação de Agendamento",
      status: "success"
    }
  }
];

export const mockPatientInfo: PatientInfo = {
  id: 1,
  name: "Maria Silva",
  phone: "(11) 99999-9999",
  email: "maria@email.com",
  last_appointment: {
    date: "15/06/2025",
    time: "14:30",
    doctor: "Dr. João",
    specialty: "Cardiologia"
  },
  recent_appointments: [
    { date: "15/06", specialty: "Cardiologia" },
    { date: "10/05", specialty: "Clínico Geral" },
    { date: "22/04", specialty: "Cardiologia" }
  ]
};

export function createTimelineItems(conversationId: number): TimelineItem[] {
  const messages = mockMessages.filter(m => m.conversation_id === conversationId);
  const events = mockSystemEvents.filter(e => e.conversation_id === conversationId);
  
  const timeline: TimelineItem[] = [];
  
  messages.forEach(message => {
    timeline.push({
      id: message.id,
      type: 'message',
      timestamp: message.timestamp,
      data: message
    });
  });
  
  events.forEach(event => {
    timeline.push({
      id: event.id + 1000, // Offset to avoid ID conflicts
      type: 'event',
      timestamp: event.timestamp,
      data: event
    });
  });
  
  // Sort by timestamp
  timeline.sort((a, b) => {
    const timeA = new Date(`2025-01-01 ${a.timestamp}`).getTime();
    const timeB = new Date(`2025-01-01 ${b.timestamp}`).getTime();
    return timeA - timeB;
  });
  
  return timeline;
}

export const conversationFilters = [
  { type: 'all' as const, label: 'Todas' },
  { type: 'unread' as const, label: 'Não lidas' },
  { type: 'ai_active' as const, label: 'IA ativa' },
  { type: 'manual' as const, label: 'Manual' }
];