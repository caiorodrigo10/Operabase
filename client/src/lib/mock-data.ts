import { Contact, Conversation, Message, Appointment, Clinic } from "@shared/schema";

export const mockClinic: Clinic = {
  id: 1,
  name: "Clínica São João",
  responsible: "Dr. Maria Silva",
  whatsapp_number: "(11) 95555-5555",
  specialties: ["Cardiologia", "Dermatologia", "Clínica Geral"],
  working_hours: "Seg-Sex: 8h-18h | Sáb: 8h-12h",
  created_at: new Date(),
};

export const mockContacts: Contact[] = [
  {
    id: 1,
    clinic_id: 1,
    name: "João Silva",
    phone: "(11) 99999-9999",
    status: "agendado",
    first_contact: new Date(Date.now() - 300000), // 5 min ago
    last_interaction: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    clinic_id: 1,
    name: "Maria Santos",
    phone: "(11) 88888-8888",
    status: "em_conversa",
    first_contact: new Date(Date.now() - 720000), // 12 min ago
    last_interaction: new Date(Date.now() - 720000),
  },
  {
    id: 3,
    clinic_id: 1,
    name: "Carlos Lima",
    phone: "(11) 77777-7777",
    status: "pos_atendimento",
    first_contact: new Date(Date.now() - 1380000), // 23 min ago
    last_interaction: new Date(Date.now() - 1380000),
  },
  {
    id: 4,
    clinic_id: 1,
    name: "Ana Costa",
    phone: "(11) 99999-0001",
    status: "novo",
    first_contact: new Date(Date.now() - 120000), // 2 min ago
    last_interaction: new Date(Date.now() - 120000),
  },
];

export const mockMessages: Message[] = [
  {
    id: 1,
    conversation_id: 1,
    sender_type: "patient",
    content: "Olá, gostaria de agendar uma consulta",
    ai_action: null,
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    conversation_id: 1,
    sender_type: "ai",
    content: "Olá João! Claro, posso ajudar você a agendar. Para qual especialidade?",
    ai_action: null,
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: 3,
    conversation_id: 1,
    sender_type: "patient",
    content: "Cardiologia, por favor",
    ai_action: null,
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: 4,
    conversation_id: 1,
    sender_type: "ai",
    content: "Perfeito! Agendei sua consulta com Dr. Maria Silva para amanhã às 14:00. Você receberá uma confirmação em breve.",
    ai_action: "agendou_consulta",
    timestamp: new Date(Date.now() - 120000),
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 1,
    contact_id: 1,
    clinic_id: 1,
    doctor_name: "Dr. Maria Silva",
    specialty: "Cardiologia",
    scheduled_date: new Date(Date.now() + 86400000), // tomorrow
    status: "agendado",
    created_at: new Date(Date.now() - 120000),
  },
];

export const mockPipelineData = {
  novo_contato: [
    {
      id: 4,
      name: "Ana Costa",
      phone: "(11) 99999-0001",
      timeInStage: "2 min no estágio",
      lastAction: "Primeira mensagem",
      isAiAction: true,
    },
    {
      id: 5,
      name: "Pedro Santos",
      phone: "(11) 99999-0002",
      timeInStage: "15 min no estágio",
      lastAction: "Aguardando resposta",
      isAiAction: false,
    },
  ],
  em_conversa: [
    {
      id: 2,
      name: "Maria Santos",
      phone: "(11) 88888-8888",
      timeInStage: "12 min no estágio",
      lastAction: "Coletando informações",
      isAiAction: true,
    },
    {
      id: 6,
      name: "Roberto Silva",
      phone: "(11) 99999-0003",
      timeInStage: "8 min no estágio",
      lastAction: "Escolhendo horário",
      isAiAction: true,
    },
  ],
  consulta_marcada: [
    {
      id: 1,
      name: "João Silva",
      phone: "(11) 99999-9999",
      timeInStage: "5 min no estágio",
      lastAction: "Amanhã 14:00",
      isAiAction: true,
    },
    {
      id: 7,
      name: "Lucia Ferreira",
      phone: "(11) 99999-0004",
      timeInStage: "2h no estágio",
      lastAction: "Sexta 09:30",
      isAiAction: true,
    },
  ],
  consulta_realizada: [
    {
      id: 3,
      name: "Carlos Lima",
      phone: "(11) 77777-7777",
      timeInStage: "23 min no estágio",
      lastAction: "Consulta finalizada",
      isAiAction: false,
    },
    {
      id: 8,
      name: "Sandra Oliveira",
      phone: "(11) 99999-0005",
      timeInStage: "1h no estágio",
      lastAction: "Consulta finalizada",
      isAiAction: false,
    },
  ],
  pos_atendimento: [
    {
      id: 3,
      name: "Carlos Lima",
      phone: "(11) 77777-7777",
      timeInStage: "Concluído",
      lastAction: "Follow-up enviado",
      isAiAction: true,
    },
    {
      id: 9,
      name: "Elena Costa",
      phone: "(11) 99999-0006",
      timeInStage: "Concluído",
      lastAction: "Avaliação recebida",
      isAiAction: true,
    },
  ],
};

export const mockMetrics = {
  mensagensHoje: 127,
  agendamentosHoje: 18,
  atendimentosAtivos: 7,
  totalMensagens: 1247,
  consultasAgendadas: 89,
  taxaSucesso: 94.2,
  satisfacao: 4.8,
  taxaConversao: 68.5,
  tempoResposta: "1.2s",
};

export const mockActivities = [
  {
    id: 1,
    action: "Consulta agendada para João Silva",
    details: "WhatsApp: (11) 99999-9999 • 5 min atrás",
    status: "Agendado",
    color: "green",
  },
  {
    id: 2,
    action: "Nova conversa iniciada com Maria Santos",
    details: "WhatsApp: (11) 88888-8888 • 12 min atrás",
    status: "Em andamento",
    color: "blue",
  },
  {
    id: 3,
    action: "Pós-atendimento enviado para Carlos Lima",
    details: "WhatsApp: (11) 77777-7777 • 23 min atrás",
    status: "Concluído",
    color: "purple",
  },
];
