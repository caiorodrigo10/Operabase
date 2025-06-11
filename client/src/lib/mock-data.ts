import { Contact, Conversation, Message, Appointment, Clinic } from "@shared/schema";

export const mockClinic: Clinic = {
  id: 1,
  name: "Centro de Psicologia Dr. Amanda Costa",
  responsible: "Dra. Amanda Costa",
  whatsapp_number: "(11) 99876-5432",
  specialties: ["Psicologia Clínica", "TDAH em Adultos", "TDAH Infantil", "Terapia Cognitivo-Comportamental"],
  working_hours: "Seg-Sex: 9h-19h | Sáb: 9h-13h",
  created_at: new Date(),
};

export const mockContacts: Contact[] = [
  {
    id: 1,
    clinic_id: 1,
    name: "Lucas Ferreira",
    phone: "(11) 99123-4567",
    status: "agendado",
    first_contact: new Date(Date.now() - 300000), // 5 min ago
    last_interaction: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    clinic_id: 1,
    name: "Carla Mendes",
    phone: "(11) 98765-4321",
    status: "em_conversa",
    first_contact: new Date(Date.now() - 720000), // 12 min ago
    last_interaction: new Date(Date.now() - 720000),
  },
  {
    id: 3,
    clinic_id: 1,
    name: "Pedro Oliveira",
    phone: "(11) 97654-3210",
    status: "pos_atendimento",
    first_contact: new Date(Date.now() - 1380000), // 23 min ago
    last_interaction: new Date(Date.now() - 1380000),
  },
  {
    id: 4,
    clinic_id: 1,
    name: "Sofia Almeida",
    phone: "(11) 96543-2109",
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
    content: "Olá, preciso de ajuda. Tenho TDAH e está ficando difícil me concentrar no trabalho",
    ai_action: null,
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: 2,
    conversation_id: 1,
    sender_type: "ai",
    content: "Olá Lucas! Entendo sua preocupação. O TDAH realmente pode impactar a concentração. Vou agendar uma avaliação com a Dra. Amanda para desenvolvermos estratégias específicas para você.",
    ai_action: null,
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: 3,
    conversation_id: 1,
    sender_type: "patient",
    content: "Seria para terapia cognitivo-comportamental mesmo?",
    ai_action: null,
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: 4,
    conversation_id: 1,
    sender_type: "ai",
    content: "Exato! A TCC é muito eficaz para TDAH em adultos. Agendei sua sessão com Dra. Amanda Costa para amanhã às 15:00. Você receberá a confirmação em breve.",
    ai_action: "agendou_consulta",
    timestamp: new Date(Date.now() - 120000),
  },
  // Carla Mendes conversation
  {
    id: 5,
    conversation_id: 2,
    sender_type: "patient",
    content: "Oi, boa tarde! É sobre meu filho de 8 anos...",
    ai_action: null,
    timestamp: new Date(Date.now() - 720000),
  },
  {
    id: 6,
    conversation_id: 2,
    sender_type: "ai",
    content: "Boa tarde, Carla! Posso ajudá-la com questões relacionadas ao seu filho. Conte-me mais sobre o que está acontecendo.",
    ai_action: null,
    timestamp: new Date(Date.now() - 700000),
  },
  {
    id: 7,
    conversation_id: 2,
    sender_type: "patient",
    content: "[ÁUDIO] - 1:23",
    ai_action: null,
    timestamp: new Date(Date.now() - 680000),
  },
  {
    id: 8,
    conversation_id: 2,
    sender_type: "ai",
    content: "Entendi suas preocupações sobre hiperatividade e dificuldade de concentração na escola. Esses podem ser sinais de TDAH infantil. É importante uma avaliação adequada. Vou priorizar um horário para hoje.",
    ai_action: "detectou_urgencia",
    timestamp: new Date(Date.now() - 660000),
  },
  {
    id: 9,
    conversation_id: 2,
    sender_type: "patient",
    content: "[IMAGEM] - Relatório escolar",
    ai_action: null,
    timestamp: new Date(Date.now() - 640000),
  },
  {
    id: 10,
    conversation_id: 2,
    sender_type: "ai",
    content: "Obrigada por enviar o relatório da escola. Vou encaminhar para a Dra. Amanda analisar antes da consulta. Sessão confirmada para hoje às 17:00.",
    ai_action: "analisou_documento",
    timestamp: new Date(Date.now() - 620000),
  },
  // Pedro Oliveira conversation (completed)
  {
    id: 11,
    conversation_id: 3,
    sender_type: "ai",
    content: "Olá Pedro! Como foi a sessão de ontem? Conseguiu aplicar as técnicas de organização que discutimos?",
    ai_action: "pos_consulta_followup",
    timestamp: new Date(Date.now() - 1380000),
  },
  {
    id: 12,
    conversation_id: 3,
    sender_type: "patient",
    content: "Oi! Foi excelente! Consegui usar o método de pomodoro e organizei minha mesa de trabalho. Já sinto diferença na produtividade!",
    ai_action: null,
    timestamp: new Date(Date.now() - 1360000),
  },
  {
    id: 13,
    conversation_id: 3,
    sender_type: "ai",
    content: "Que progresso maravilhoso! Continue praticando essas estratégias. Vou agendar seu retorno em 15 dias para acompanharmos sua evolução. Parabéns pelo empenho!",
    ai_action: "agendou_retorno",
    timestamp: new Date(Date.now() - 1340000),
  },
  // Sofia Almeida conversation (new contact)
  {
    id: 14,
    conversation_id: 4,
    sender_type: "patient",
    content: "Olá, vi vocês no Instagram",
    ai_action: null,
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: 15,
    conversation_id: 4,
    sender_type: "ai",
    content: "Olá Sofia! Seja bem-vinda ao Centro de Psicologia Dra. Amanda Costa! Sou a Livia, assistente virtual especializada em TDAH. Como posso ajudá-la hoje?",
    ai_action: "primeira_interacao",
    timestamp: new Date(Date.now() - 100000),
  },
];

export const mockAppointments: Appointment[] = [
  {
    id: 1,
    contact_id: 1,
    clinic_id: 1,
    doctor_name: "Dra. Amanda Costa",
    specialty: "TDAH em Adultos",
    scheduled_date: new Date(Date.now() + 86400000), // tomorrow
    status: "agendado",
    created_at: new Date(Date.now() - 120000),
  },
  {
    id: 2,
    contact_id: 2,
    clinic_id: 1,
    doctor_name: "Dra. Amanda Costa",
    specialty: "TDAH Infantil",
    scheduled_date: new Date(Date.now() + 21600000), // today 6h from now
    status: "agendado",
    created_at: new Date(Date.now() - 620000),
  },
];

export const mockPipelineData = {
  novo_contato: [
    {
      id: 4,
      name: "Sofia Almeida",
      phone: "(11) 96543-2109",
      timeInStage: "2 min no estágio",
      lastAction: "Primeira interação",
      isAiAction: true,
    },
    {
      id: 5,
      name: "Rafael Santos",
      phone: "(11) 95432-1098",
      timeInStage: "15 min no estágio",
      lastAction: "Triagem inicial TDAH",
      isAiAction: true,
    },
  ],
  em_conversa: [
    {
      id: 2,
      name: "Carla Mendes",
      phone: "(11) 98765-4321",
      timeInStage: "12 min no estágio",
      lastAction: "Avaliando TDAH infantil",
      isAiAction: true,
    },
    {
      id: 6,
      name: "Marcos Silva",
      phone: "(11) 94321-0987",
      timeInStage: "8 min no estágio",
      lastAction: "Discussão sobre sintomas",
      isAiAction: true,
    },
  ],
  consulta_marcada: [
    {
      id: 1,
      name: "Lucas Ferreira",
      phone: "(11) 99123-4567",
      timeInStage: "5 min no estágio",
      lastAction: "Amanhã 15:00 - TCC",
      isAiAction: true,
    },
    {
      id: 7,
      name: "Julia Costa",
      phone: "(11) 93210-9876",
      timeInStage: "2h no estágio",
      lastAction: "Sexta 10:00 - Avaliação",
      isAiAction: true,
    },
  ],
  consulta_realizada: [
    {
      id: 3,
      name: "Pedro Oliveira",
      phone: "(11) 97654-3210",
      timeInStage: "23 min no estágio",
      lastAction: "Sessão de TCC finalizada",
      isAiAction: false,
    },
    {
      id: 8,
      name: "Ana Beatriz",
      phone: "(11) 92109-8765",
      timeInStage: "1h no estágio",
      lastAction: "Avaliação TDAH concluída",
      isAiAction: false,
    },
  ],
  pos_atendimento: [
    {
      id: 3,
      name: "Pedro Oliveira",
      phone: "(11) 97654-3210",
      timeInStage: "Concluído",
      lastAction: "Follow-up TCC enviado",
      isAiAction: true,
    },
    {
      id: 9,
      name: "Gabriel Rocha",
      phone: "(11) 91098-7654",
      timeInStage: "Concluído",
      lastAction: "Exercícios de concentração",
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
    action: "Sessão de TCC agendada para Lucas Ferreira",
    details: "WhatsApp: (11) 99123-4567 • 5 min atrás",
    status: "Agendado",
    color: "green",
  },
  {
    id: 2,
    action: "Triagem TDAH infantil com Carla Mendes",
    details: "WhatsApp: (11) 98765-4321 • 12 min atrás",
    status: "Em andamento",
    color: "blue",
  },
  {
    id: 3,
    action: "Follow-up TCC enviado para Pedro Oliveira",
    details: "WhatsApp: (11) 97654-3210 • 23 min atrás",
    status: "Concluído",
    color: "purple",
  },
];
