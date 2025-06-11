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
  // Maria Santos conversation
  {
    id: 5,
    conversation_id: 2,
    sender_type: "patient",
    content: "Oi, bom dia!",
    ai_action: null,
    timestamp: new Date(Date.now() - 720000),
  },
  {
    id: 6,
    conversation_id: 2,
    sender_type: "ai",
    content: "Bom dia, Maria! Como posso ajudá-la hoje?",
    ai_action: null,
    timestamp: new Date(Date.now() - 700000),
  },
  {
    id: 7,
    conversation_id: 2,
    sender_type: "patient",
    content: "[ÁUDIO] - 0:15",
    ai_action: null,
    timestamp: new Date(Date.now() - 680000),
  },
  {
    id: 8,
    conversation_id: 2,
    sender_type: "ai",
    content: "Entendi que você está sentindo dores no peito. Isso é preocupante e precisamos avaliar. Vou agendar uma consulta urgente para hoje.",
    ai_action: "detectou_urgencia",
    timestamp: new Date(Date.now() - 660000),
  },
  {
    id: 9,
    conversation_id: 2,
    sender_type: "patient",
    content: "[IMAGEM] - Resultado de exame",
    ai_action: null,
    timestamp: new Date(Date.now() - 640000),
  },
  {
    id: 10,
    conversation_id: 2,
    sender_type: "ai",
    content: "Obrigada por enviar o exame. Vou encaminhar para o Dr. Silva analisar. Consulta confirmada para hoje às 16:00.",
    ai_action: "analisou_exame",
    timestamp: new Date(Date.now() - 620000),
  },
  // Carlos Lima conversation (completed)
  {
    id: 11,
    conversation_id: 3,
    sender_type: "ai",
    content: "Olá Carlos! Como foi sua consulta de ontem? Gostaria de saber como você está se sentindo.",
    ai_action: "pos_consulta_followup",
    timestamp: new Date(Date.now() - 1380000),
  },
  {
    id: 12,
    conversation_id: 3,
    sender_type: "patient",
    content: "Oi! Foi muito boa, o médico me passou uma dieta e uns exercícios. Já estou me sentindo melhor!",
    ai_action: null,
    timestamp: new Date(Date.now() - 1360000),
  },
  {
    id: 13,
    conversation_id: 3,
    sender_type: "ai",
    content: "Que ótimo! Lembre-se de seguir as orientações médicas. Vou agendar um retorno em 30 dias para acompanhamento. Cuide-se! 😊",
    ai_action: "agendou_retorno",
    timestamp: new Date(Date.now() - 1340000),
  },
  // Ana Costa conversation (new contact)
  {
    id: 14,
    conversation_id: 4,
    sender_type: "patient",
    content: "Olá",
    ai_action: null,
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: 15,
    conversation_id: 4,
    sender_type: "ai",
    content: "Olá Ana! Seja bem-vinda à Clínica São João. Sou a Livia, sua assistente virtual. Como posso ajudá-la hoje?",
    ai_action: "primeira_interacao",
    timestamp: new Date(Date.now() - 100000),
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

export const weeklyPerformanceData = [
  { day: "Dom", mensagens: 45, agendamentos: 8, conversoes: 17.8 },
  { day: "Seg", mensagens: 89, agendamentos: 12, conversoes: 13.5 },
  { day: "Ter", mensagens: 156, agendamentos: 23, conversoes: 14.7 },
  { day: "Qua", mensagens: 143, agendamentos: 19, conversoes: 13.3 },
  { day: "Qui", mensagens: 167, agendamentos: 28, conversoes: 16.8 },
  { day: "Sex", mensagens: 134, agendamentos: 21, conversoes: 15.7 },
  { day: "Sab", mensagens: 78, agendamentos: 11, conversoes: 14.1 },
];

export const conversionData = [
  { name: "Novos Contatos", value: 45, fill: "#3b82f6" },
  { name: "Em Conversa", value: 28, fill: "#8b5cf6" },
  { name: "Agendados", value: 18, fill: "#10b981" },
  { name: "Não Convertidos", value: 9, fill: "#6b7280" },
];

export const hourlyActivityData = [
  { hour: "06:00", atividade: 12 },
  { hour: "07:00", atividade: 19 },
  { hour: "08:00", atividade: 35 },
  { hour: "09:00", atividade: 58 },
  { hour: "10:00", atividade: 67 },
  { hour: "11:00", atividade: 72 },
  { hour: "12:00", atividade: 43 },
  { hour: "13:00", atividade: 38 },
  { hour: "14:00", atividade: 89 },
  { hour: "15:00", atividade: 94 },
  { hour: "16:00", atividade: 87 },
  { hour: "17:00", atividade: 76 },
  { hour: "18:00", atividade: 54 },
  { hour: "19:00", atividade: 32 },
  { hour: "20:00", atividade: 21 },
  { hour: "21:00", atividade: 15 },
  { hour: "22:00", atividade: 8 },
];

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
