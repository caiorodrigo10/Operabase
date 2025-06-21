import { Conversation, Message, SystemEvent, TimelineItem, PatientInfo } from '@/types/conversations';

export const mockConversations: Conversation[] = [
  {
    id: 1,
    patient_name: "Maria Silva",
    patient_avatar: undefined,
    last_message: "Muito obrigada! Vocês são sempre muito atenciosos. Até terça!",
    timestamp: "09:26",
    unread_count: 0,
    status: 'active',
    ai_active: true,
    has_pending_appointment: true
  },
  {
    id: 2,
    patient_name: "João Santos",
    patient_avatar: undefined,
    last_message: "Perfeito! Obrigado pelas orientações, doutor. Vou anotar tudo certinho.",
    timestamp: "14:45",
    unread_count: 0,
    status: 'active',
    ai_active: true,
    has_pending_appointment: false
  },
  {
    id: 3,
    patient_name: "Ana Costa",
    patient_avatar: undefined,
    last_message: "Que alívio! Muito obrigada, doutora. Até amanhã! ❤️",
    timestamp: "09:03",
    unread_count: 0,
    status: 'active',
    ai_active: true,
    has_pending_appointment: true
  },
  {
    id: 4,
    patient_name: "Carlos Oliveira",
    patient_avatar: undefined,
    last_message: "Doutor, preciso de ajuda urgente!",
    timestamp: "16:20",
    unread_count: 3,
    status: 'active',
    ai_active: false,
    has_pending_appointment: false
  },
  {
    id: 5,
    patient_name: "Patricia Lima",
    patient_avatar: undefined,
    last_message: "Obrigada! Já estou me sentindo melhor seguindo suas orientações.",
    timestamp: "11:40",
    unread_count: 1,
    status: 'active',
    ai_active: true,
    has_pending_appointment: false
  }
];

export const mockMessages: Message[] = [
  // Conversation 1 - Maria Silva
  { id: 1, conversation_id: 1, type: 'received', content: "Bom dia, Dra. Paula! Como está?", timestamp: "09:15", sender_name: "Maria Silva" },
  { id: 2, conversation_id: 1, type: 'sent_user', content: "Bom dia, Maria! Tudo bem por aqui. Como você está se sentindo?", timestamp: "09:17", sender_name: "Dra. Paula" },
  { id: 3, conversation_id: 1, type: 'received', content: "Estou bem, mas gostaria de remarcar minha consulta da próxima semana. Surgiu um compromisso inadiável no trabalho.", timestamp: "09:18", sender_name: "Maria Silva" },
  { id: 4, conversation_id: 1, type: 'sent_user', content: "Claro! Sem problemas. Vou verificar a agenda para encontrarmos outro horário que funcione para você.", timestamp: "09:19", sender_name: "Dra. Paula" },
  { id: 5, conversation_id: 1, type: 'sent_ai', content: "Encontrei algumas opções disponíveis: terça às 14h, quarta às 10h ou quinta às 16h. Qual prefere?", timestamp: "09:20", sender_name: "IA" },
  { id: 6, conversation_id: 1, type: 'received', content: "A terça às 14h seria perfeita! Posso confirmar esse horário?", timestamp: "09:22", sender_name: "Maria Silva" },
  { id: 7, conversation_id: 1, type: 'sent_user', content: "Perfeito! Vou agendar para terça-feira às 14h.", timestamp: "09:23", sender_name: "Dra. Paula" },
  { id: 8, conversation_id: 1, type: 'sent_ai', content: "Agendamento confirmado! Você receberá um lembrete 24h antes da consulta.", timestamp: "09:24", sender_name: "IA" },
  { id: 9, conversation_id: 1, type: 'received', content: "Muito obrigada! Vocês são sempre muito atenciosos. Até terça!", timestamp: "09:25", sender_name: "Maria Silva" },
  { id: 10, conversation_id: 1, type: 'sent_user', content: "Sempre às ordens, Maria! Tenha uma ótima semana e até terça às 14h. 😊", timestamp: "09:26", sender_name: "Dra. Paula" },

  // Conversation 2 - João Santos
  { id: 11, conversation_id: 2, type: 'received', content: "Dr. Carlos, boa tarde! Estou com uma dúvida sobre meu medicamento.", timestamp: "14:30", sender_name: "João Santos" },
  { id: 12, conversation_id: 2, type: 'sent_user', content: "Boa tarde, João! Qual é sua dúvida? Estou aqui para ajudar.", timestamp: "14:32", sender_name: "Dr. Carlos" },
  { id: 13, conversation_id: 2, type: 'received', content: "Esqueci de tomar a metformina ontem à noite. Devo tomar uma dose dupla hoje?", timestamp: "14:33", sender_name: "João Santos" },
  { id: 14, conversation_id: 2, type: 'sent_user', content: "Não, João! Nunca tome dose dupla. Continue com sua rotina normal e tome apenas a dose de hoje nos horários habituais.", timestamp: "14:35", sender_name: "Dr. Carlos" },
  { id: 15, conversation_id: 2, type: 'received', content: "Entendi. E como faço para não esquecer mais? Às vezes fico confuso com os horários.", timestamp: "14:36", sender_name: "João Santos" },
  { id: 16, conversation_id: 2, type: 'sent_ai', content: "Posso sugerir algumas estratégias: usar alarme no celular, deixar o medicamento sempre no mesmo local visível, ou usar um organizador de comprimidos semanal.", timestamp: "14:37", sender_name: "IA" },
  { id: 17, conversation_id: 2, type: 'received', content: "Boa ideia! Vou comprar um desses organizadores. Aproveito para perguntar: minha glicemia hoje cedo estava 160. Está alta?", timestamp: "14:39", sender_name: "João Santos" },
  { id: 18, conversation_id: 2, type: 'sent_user', content: "Sim, está um pouco elevada. O ideal é manter entre 70-130 em jejum. Você tomou café da manhã antes de medir?", timestamp: "14:41", sender_name: "Dr. Carlos" },
  { id: 19, conversation_id: 2, type: 'received', content: "Não, foi em jejum mesmo. Ontem comi uma sobremesa no almoço, pode ter influenciado?", timestamp: "14:42", sender_name: "João Santos" },
  { id: 20, conversation_id: 2, type: 'sent_user', content: "Pode sim. Vamos monitorar por alguns dias. Continue medindo em jejum e anote os valores. Se persistir alto, ajustamos a medicação na próxima consulta.", timestamp: "14:44", sender_name: "Dr. Carlos" },
  { id: 21, conversation_id: 2, type: 'received', content: "Perfeito! Obrigado pelas orientações, doutor. Vou anotar tudo certinho.", timestamp: "14:45", sender_name: "João Santos" },

  // Conversation 3 - Ana Costa
  { id: 22, conversation_id: 3, type: 'received', content: "Dra. Fernanda, bom dia! Tudo bem?", timestamp: "08:45", sender_name: "Ana Costa" },
  { id: 23, conversation_id: 3, type: 'sent_user', content: "Bom dia, Ana! Tudo ótimo por aqui. Como você e o bebê estão?", timestamp: "08:47", sender_name: "Dra. Fernanda" },
  { id: 24, conversation_id: 3, type: 'received', content: "Estamos bem! O bebê está mexendo bastante hoje. 😊 Queria confirmar se minha consulta do pré-natal continua para amanhã.", timestamp: "08:48", sender_name: "Ana Costa" },
  { id: 25, conversation_id: 3, type: 'sent_user', content: "Que bom saber que vocês estão bem! Vou verificar sua consulta na agenda.", timestamp: "08:49", sender_name: "Dra. Fernanda" },
  { id: 26, conversation_id: 3, type: 'sent_ai', content: "Sua consulta está confirmada para amanhã às 15h30. É recomendado chegar 15 minutos antes para a coleta de urina de rotina.", timestamp: "08:50", sender_name: "IA" },
  { id: 27, conversation_id: 3, type: 'received', content: "Perfeito! Já estava com saudades de escutar o coraçãozinho dele. Preciso levar algum exame específico?", timestamp: "08:52", sender_name: "Ana Costa" },
  { id: 28, conversation_id: 3, type: 'sent_user', content: "Traga os exames de sangue que pedimos na última consulta, se já ficaram prontos. Caso contrário, sem problemas!", timestamp: "08:54", sender_name: "Dra. Fernanda" },
  { id: 29, conversation_id: 3, type: 'received', content: "Já peguei! Hemograma e glicemia estão normais. Posso enviar por foto aqui mesmo?", timestamp: "08:55", sender_name: "Ana Costa" },
  { id: 30, conversation_id: 3, type: 'sent_user', content: "Pode sim! Mande as fotos que já vou dando uma olhada prévia.", timestamp: "08:56", sender_name: "Dra. Fernanda" },
  { id: 31, conversation_id: 3, type: 'received', content: "[Imagem: Exame de sangue - Hemograma]", timestamp: "08:57", sender_name: "Ana Costa" },
  { id: 32, conversation_id: 3, type: 'received', content: "[Imagem: Exame de sangue - Glicemia]", timestamp: "08:57", sender_name: "Ana Costa" },
  { id: 33, conversation_id: 3, type: 'sent_user', content: "Exames perfeitos, Ana! Tudo dentro da normalidade. Conversamos melhor amanhã, mas pode ficar tranquila.", timestamp: "09:02", sender_name: "Dra. Fernanda" },
  { id: 34, conversation_id: 3, type: 'received', content: "Que alívio! Muito obrigada, doutora. Até amanhã! ❤️", timestamp: "09:03", sender_name: "Ana Costa" },

  // Conversation 4 - Carlos Oliveira
  { id: 35, conversation_id: 4, type: 'received', content: "Dr. Roberto, preciso de ajuda urgente!", timestamp: "16:20", sender_name: "Carlos Oliveira" },
  { id: 36, conversation_id: 4, type: 'sent_user', content: "Carlos, o que está acontecendo? Me conte os detalhes.", timestamp: "16:21", sender_name: "Dr. Roberto" },
  { id: 37, conversation_id: 4, type: 'received', content: "Estou sentindo um desconforto no peito desde o almoço. Não é dor forte, mas estou preocupado.", timestamp: "16:22", sender_name: "Carlos Oliveira" },
  { id: 38, conversation_id: 4, type: 'sent_user', content: "Entendo sua preocupação. Esse desconforto irradia para braço, pescoço ou costas? Está com falta de ar?", timestamp: "16:23", sender_name: "Dr. Roberto" },
  { id: 39, conversation_id: 4, type: 'received', content: "Não irradia, não. E não estou com falta de ar. É mais como uma pressão leve no peito.", timestamp: "16:24", sender_name: "Carlos Oliveira" },
  { id: 40, conversation_id: 4, type: 'sent_user', content: "Tomou todos os medicamentos hoje? E como está a pressão arterial?", timestamp: "16:25", sender_name: "Dr. Roberto" },

  // Conversation 5 - Patricia Lima
  { id: 41, conversation_id: 5, type: 'received', content: "Dra. Lucia, bom dia! Como está?", timestamp: "10:30", sender_name: "Patricia Lima" },
  { id: 42, conversation_id: 5, type: 'sent_user', content: "Bom dia, Patricia! Estou bem, obrigada. Como você está se sentindo com o novo tratamento?", timestamp: "10:32", sender_name: "Dra. Lucia" },
  { id: 43, conversation_id: 5, type: 'received', content: "Muito melhor! A ansiedade diminuiu bastante desde que comecei a tomar o medicamento.", timestamp: "10:33", sender_name: "Patricia Lima" },
  { id: 44, conversation_id: 5, type: 'sent_user', content: "Que ótima notícia! E os exercícios de respiração que conversamos? Está conseguindo praticar?", timestamp: "10:35", sender_name: "Dra. Lucia" },
  { id: 45, conversation_id: 5, type: 'received', content: "Sim! Faço todos os dias pela manhã. Realmente ajuda muito a começar o dia mais calma.", timestamp: "10:36", sender_name: "Patricia Lima" },
  { id: 46, conversation_id: 5, type: 'sent_ai', content: "Excelente progresso! Manter a rotina de exercícios respiratórios potencializa os efeitos da medicação.", timestamp: "10:37", sender_name: "IA" },
  { id: 47, conversation_id: 5, type: 'received', content: "Queria tirar uma dúvida: posso tomar um chá de camomila junto com o medicamento?", timestamp: "10:38", sender_name: "Patricia Lima" },
  { id: 48, conversation_id: 5, type: 'sent_user', content: "Pode sim! Camomila é um excelente complemento natural. Inclusive pode potencializar o efeito relaxante.", timestamp: "10:39", sender_name: "Dra. Lucia" },
  { id: 49, conversation_id: 5, type: 'received', content: "Perfeito! E sobre a nossa próxima consulta, pode ser na mesma data?", timestamp: "10:40", sender_name: "Patricia Lima" },
  { id: 50, conversation_id: 5, type: 'sent_user', content: "Mantemos na sexta às 11h então. Vou anotar seu progresso no prontuário.", timestamp: "10:41", sender_name: "Dra. Lucia" },
  { id: 51, conversation_id: 5, type: 'received', content: "Obrigada! Já estou me sentindo melhor seguindo suas orientações.", timestamp: "11:40", sender_name: "Patricia Lima" }
];

export const mockSystemEvents: SystemEvent[] = [
  // Conversation 1 - Maria Silva
  { id: 1, conversation_id: 1, type: 'availability_check', content: "🔍 IA consultou horários disponíveis", timestamp: "09:19" },
  { id: 2, conversation_id: 1, type: 'appointment_created', content: "📅 Consulta agendada: 28/06 às 14:00 - Dra. Paula", timestamp: "09:23", metadata: { appointment_date: "28/06/2025", appointment_time: "14:00", doctor_name: "Dra. Paula" } },
  { id: 3, conversation_id: 1, type: 'webhook_executed', content: "✅ Confirmação de Agendamento enviada por SMS", timestamp: "09:26", metadata: { webhook_name: "Confirmação de Agendamento", status: "success" } },

  // Conversation 2 - João Santos
  { id: 4, conversation_id: 2, type: 'medical_guidance', content: "📝 Orientação médica registrada no prontuário", timestamp: "14:45" },

  // Conversation 3 - Ana Costa
  { id: 5, conversation_id: 3, type: 'availability_check', content: "🔍 IA consultou agenda médica", timestamp: "08:49" },
  { id: 6, conversation_id: 3, type: 'exam_analysis', content: "🔬 IA analisou resultados dos exames", timestamp: "09:01" },

  // Conversation 4 - Carlos Oliveira
  { id: 7, conversation_id: 4, type: 'priority_alert', content: "🚨 Alerta: Paciente relatou desconforto no peito", timestamp: "16:22" },
  { id: 8, conversation_id: 4, type: 'medical_triage', content: "⚕️ Triagem médica iniciada - Prioridade: Moderada", timestamp: "16:23" },

  // Conversation 5 - Patricia Lima
  { id: 9, conversation_id: 5, type: 'treatment_progress', content: "📈 Progresso do tratamento registrado", timestamp: "10:37" },
  { id: 10, conversation_id: 5, type: 'appointment_reminder', content: "📅 Lembrete agendado: Consulta sexta às 11h", timestamp: "10:41" }
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

// Dashboard mock data exports to fix the missing imports
export const mockMetrics = {
  totalContacts: 150,
  monthlyAppointments: 45,
  completedAppointments: 38,
  pendingAppointments: 7
};

export const mockActivities = [
  { id: 1, type: 'appointment', description: 'Nova consulta agendada', time: '10 min' },
  { id: 2, type: 'contact', description: 'Novo contato adicionado', time: '25 min' },
  { id: 3, type: 'ai', description: 'IA respondeu automaticamente', time: '1h' }
];

export const weeklyPerformanceData = [
  { name: 'Seg', appointments: 8, contacts: 12 },
  { name: 'Ter', appointments: 12, contacts: 15 },
  { name: 'Qua', appointments: 15, contacts: 18 },
  { name: 'Qui', appointments: 10, contacts: 14 },
  { name: 'Sex', appointments: 14, contacts: 20 },
  { name: 'Sáb', appointments: 6, contacts: 8 },
  { name: 'Dom', appointments: 3, contacts: 5 }
];

export const conversionData = [
  { name: 'Novos Contatos', value: 45, color: '#3b82f6' },
  { name: 'Agendamentos', value: 30, color: '#10b981' },
  { name: 'Consultas Realizadas', value: 25, color: '#f59e0b' }
];

export const hourlyActivityData = [
  { hour: '8h', activity: 5 },
  { hour: '9h', activity: 12 },
  { hour: '10h', activity: 18 },
  { hour: '11h', activity: 22 },
  { hour: '12h', activity: 15 },
  { hour: '13h', activity: 8 },
  { hour: '14h', activity: 25 },
  { hour: '15h', activity: 28 },
  { hour: '16h', activity: 20 },
  { hour: '17h', activity: 15 },
  { hour: '18h', activity: 10 }
];

export const mockPipelineData = [
  {
    id: 1,
    name: "Maria Silva",
    phone: "(11) 99999-9999",
    email: "maria@email.com",
    stage: "novo",
    last_interaction: "2025-01-20T14:30:00Z",
    source: "whatsapp"
  },
  {
    id: 2,
    name: "João Santos",
    phone: "(11) 88888-8888",
    email: "joao@email.com",
    stage: "em_conversa",
    last_interaction: "2025-01-20T12:15:00Z",
    source: "telefone"
  },
  {
    id: 3,
    name: "Ana Costa",
    phone: "(11) 77777-7777",
    email: "ana@email.com",
    stage: "agendado",
    last_interaction: "2025-01-20T10:45:00Z",
    source: "site"
  }
];