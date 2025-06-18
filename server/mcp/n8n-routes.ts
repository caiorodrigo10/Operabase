import { Router, Request, Response } from 'express';
import { appointmentAgent, VALID_APPOINTMENT_STATUSES, VALID_PAYMENT_STATUSES } from './appointment-agent-simple';
import { chatInterpreter } from './chat-interpreter';
import { z } from 'zod';
import { mcpLogsService } from './logs.service';
import { eq, and, gte, lte, ne, sql } from 'drizzle-orm';
import { appointments } from '../domains/appointments/appointments.schema';
import { contacts } from '../domains/contacts/contacts.schema';
import { users } from '../domains/auth/auth.schema';
import { appointment_tags } from '../../shared/schema';
import { clinic_users } from '../domains/clinics/clinics.schema';
import { db } from '../db';
import { apiKeyAuth, requireWritePermission, ApiKeyRequest } from '../middleware/api-key-auth.middleware';

const router = Router();

// Apply API Key authentication to all MCP routes
router.use(apiKeyAuth);

// Request validation middleware that works with API Key context
const validateRequest = (schema: z.ZodSchema) => {
  return (req: ApiKeyRequest, res: Response, next: any) => {
    try {
      // Inject clinic_id from API Key if not provided
      if (req.clinicId && !req.body.clinic_id) {
        req.body.clinic_id = req.clinicId;
      }
      
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          data: null,
          error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          appointment_id: null,
          conflicts: null,
          next_available_slots: null
        });
      }
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid request format',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      });
    }
  };
};

// Schema definitions for n8n integration
const CreateAppointmentRequestSchema = z.object({
  contact_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration_minutes: z.number().int().min(15).max(480),
  status: z.enum(VALID_APPOINTMENT_STATUSES).optional().default('agendada'),
  doctor_name: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  appointment_type: z.string().nullable().optional(),
  session_notes: z.string().nullable().optional(),
  payment_status: z.enum(VALID_PAYMENT_STATUSES).optional().default('pendente'),
  payment_amount: z.number().int().nullable().optional(),
  tag_id: z.number().int().nullable().optional()
});

const UpdateStatusRequestSchema = z.object({
  appointment_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  status: z.enum(VALID_APPOINTMENT_STATUSES),
  session_notes: z.string().nullable().optional()
});

const RescheduleRequestSchema = z.object({
  appointment_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration_minutes: z.number().int().min(15).max(480).optional()
});

const CancelRequestSchema = z.object({
  appointment_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  cancelled_by: z.enum(['paciente', 'dentista']),
  reason: z.string().optional()
});

const AvailabilityRequestSchema = z.object({
  clinic_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_minutes: z.number().int().min(15).max(480),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default('08:00'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().default('18:00')
});

const ListAppointmentsRequestSchema = z.object({
  clinic_id: z.number().int().positive(),
  user_id: z.number().int().positive().optional(),
  contact_id: z.number().int().positive().optional(),
  status: z.enum(VALID_APPOINTMENT_STATUSES).optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0)
});

const CreateContactRequestSchema = z.object({
  clinic_id: z.number().int().positive(),
  name: z.string().min(2).max(100),
  phone: z.string().min(10).max(20),
  email: z.string().email().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postal_code: z.string().max(20).optional(),
  emergency_contact: z.string().max(100).optional(),
  emergency_phone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string()).optional().default([])
});

/**
 * POST /api/mcp/appointments/create
 * Create a new appointment with full validation
 */
router.post('/appointments/create', 
  requireWritePermission,
  validateRequest(CreateAppointmentRequestSchema), 
  async (req: ApiKeyRequest, res: Response) => {
    try {
      // Override clinic_id with the one from API Key for security
      const requestData = {
        ...req.body,
        clinic_id: req.clinicId, // Use clinic_id from API Key authentication
      };

      const result = await appointmentAgent.createAppointment(requestData);

      const statusCode = result.success ? 201 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error('MCP Create Appointment Error:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: 'Internal server error',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      });
    }
  }
);

/**
 * PUT /api/mcp/appointments/status
 * Update appointment status
 */
router.put('/appointments/status', 
  requireWritePermission,
  validateRequest(UpdateStatusRequestSchema), 
  async (req: ApiKeyRequest, res: Response) => {
    try {
      // Override clinic_id with the one from API Key for security
      const requestData = {
        ...req.body,
        clinic_id: req.clinicId,
      };

      const result = await appointmentAgent.updateStatus(requestData);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);

    } catch (error) {
      console.error('MCP Update Status Error:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: 'Internal server error',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      });
    }
  }
);

/**
 * PUT /api/mcp/appointments/reschedule
 * Reschedule an appointment
 */
router.put('/appointments/reschedule', validateRequest(RescheduleRequestSchema), async (req: Request, res: Response) => {
  try {
    const result = await appointmentAgent.rescheduleAppointment(req.body);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('MCP Reschedule Error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });
  }
});

/**
 * PUT /api/mcp/appointments/cancel
 * Cancel an appointment
 */
router.put('/appointments/cancel', validateRequest(CancelRequestSchema), async (req: Request, res: Response) => {
  try {
    const { appointment_id, clinic_id, cancelled_by, reason } = req.body;

    const result = await appointmentAgent.cancelAppointment(
      appointment_id, 
      clinic_id, 
      cancelled_by, 
      reason
    );

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('MCP Cancel Appointment Error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });
  }
});

/**
 * POST /api/mcp/appointments/availability
 * Get available time slots
 */
router.post('/appointments/availability', validateRequest(AvailabilityRequestSchema), async (req: Request, res: Response) => {
  try {
    const result = await appointmentAgent.getAvailableSlots(req.body);

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('MCP Availability Error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });
  }
});

/**
 * POST /api/mcp/appointments/list
 * List appointments with filters
 */
router.post('/appointments/list', validateRequest(ListAppointmentsRequestSchema), async (req: Request, res: Response) => {
  try {
    const { clinic_id, user_id, contact_id, status, date_from, date_to, limit, offset } = req.body;

    const result = await appointmentAgent.listAppointments(clinic_id, {
      userId: user_id,
      contactId: contact_id,
      status: status,
      startDate: date_from,
      endDate: date_to
    }, {
      limit: limit,
      offset: offset
    });

    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('MCP List Appointments Error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });
  }
});

/**
 * GET /api/mcp/appointments/:id
 * Get specific appointment details
 */
router.get('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.id);
    const clinicId = parseInt(req.query.clinic_id as string);

    if (!appointmentId || !clinicId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'appointment_id and clinic_id are required',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      });
    }

    const result = await appointmentAgent.listAppointments(clinicId, {});

    if (result.success && result.data) {
      const appointment = result.data.find((apt: any) => apt.id === appointmentId);

      if (appointment) {
        return res.status(200).json({
          success: true,
          data: appointment,
          error: null,
          appointment_id: appointment.id,
          conflicts: null,
          next_available_slots: null
        });
      }
    }

    res.status(404).json({
      success: false,
      data: null,
      error: 'Appointment not found',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });

  } catch (error) {
    console.error('MCP Get Appointment Error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });
  }
});

/**
 * GET /api/mcp/status/valid
 * Get list of valid appointment statuses
 */
router.get('/status/valid', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      appointment_statuses: VALID_APPOINTMENT_STATUSES,
      payment_statuses: VALID_PAYMENT_STATUSES
    },
    error: null,
    appointment_id: null,
    conflicts: null,
    next_available_slots: null
  });
});

/**
 * GET /api/mcp/health
 * Health check endpoint for n8n monitoring
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    },
    error: null,
    appointment_id: null,
    conflicts: null,
    next_available_slots: null
  });
});

// 9. Chat Interpreter - NEW endpoint for OpenAI interpretation
const ChatMessageSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional()
});

/**
 * POST /api/mcp/contacts/create
 * Create a new contact/patient
 */
router.post('/contacts/create', 
  requireWritePermission,
  validateRequest(CreateContactRequestSchema), 
  async (req: ApiKeyRequest, res: Response) => {
    try {
      const contactData = req.body;
      
      // Create contact
      const newContact = await db.insert(contacts).values({
        clinic_id: contactData.clinic_id,
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email || null,
        date_of_birth: contactData.date_of_birth ? new Date(contactData.date_of_birth) : null,
        address: contactData.address || null,
        city: contactData.city || null,
        state: contactData.state || null,
        postal_code: contactData.postal_code || null,
        emergency_contact: contactData.emergency_contact || null,
        emergency_phone: contactData.emergency_phone || null,
        notes: contactData.notes || null,
        tags: contactData.tags || [],
        status: 'ativo',
        created_at: new Date(),
        updated_at: new Date()
      }).returning();

      const contact = newContact[0];

      res.status(201).json({
        success: true,
        data: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          clinic_id: contact.clinic_id,
          status: contact.status,
          created_at: contact.created_at
        },
        contact_id: contact.id,
        error: null
      });

    } catch (error) {
      console.error('❌ Error creating contact:', error);
      res.status(500).json({
        success: false,
        data: null,
        error: 'Erro interno ao criar contato',
        contact_id: null
      });
    }
  }
);

// Endpoint simplificado para chat WhatsApp natural
router.post('/chat', validateRequest(ChatMessageSchema), async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { message, sessionId } = req.body;

    // Log da requisição do chat
    mcpLogsService.addLog({
      type: 'mcp',
      level: 'info',
      message: `Marina recebeu mensagem: "${message}"`,
      data: { 
        sessionId, 
        userMessage: message,
        endpoint: '/api/mcp/chat'
      }
    });

    console.log('🗨️ Marina Chat Request:', { message, sessionId });

    const result = await chatInterpreter.interpretMessage(message, sessionId);

    // Log do resultado da interpretação
    mcpLogsService.addLog({
      type: 'openai',
      level: result.success ? 'info' : 'error',
      message: `Interpretação OpenAI: ${result.success ? 'sucesso' : 'falha'}`,
      data: { 
        sessionId,
        success: result.success,
        action: result.data?.action,
        responseTime: Date.now() - startTime
      }
    });

    if (result.success && result.data) {
      const action = result.data.action;
      let naturalResponse = '';
      let mcpResult = null;

      // Executar ações MCP dinamicamente baseado na interpretação OpenAI
      switch (action) {
        case 'chat_response':
          naturalResponse = result.data.message || 'Olá! Como posso ajudar você hoje?';
          break;

        case 'create':
          try {
            console.log('🔄 Creating appointment via MCP:', result.data);

            // Validar dados obrigatórios
            if (!result.data.contact_name || !result.data.date || !result.data.time) {
              throw new Error('Dados obrigatórios faltando: contact_name, date, time');
            }

            // 🔍 Procurar ou criar contato automaticamente
            let contact_id: number;

            try {
              // Tentar encontrar contato existente pelo nome
              const existingContacts = await db.select()
                .from(contacts)
                .where(and(
                  eq(contacts.clinic_id, result.data.clinic_id || 1),
                  sql`LOWER(${contacts.name}) = LOWER(${result.data.contact_name})`
                ))
                .limit(1);

              if (existingContacts.length > 0) {
                contact_id = existingContacts[0].id;
                console.log('👤 Contato encontrado:', { id: contact_id, name: result.data.contact_name });
              } else {
                // Criar novo contato automaticamente
                const newContact = await db.insert(contacts).values({
                  clinic_id: result.data.clinic_id || 1,
                  name: result.data.contact_name,
                  phone: '(00) 00000-0000', // Telefone padrão para contatos criados via chat
                  status: 'lead',
                  source: 'mcp_chat',
                  created_at: new Date(),
                  updated_at: new Date()
                }).returning();

                contact_id = newContact[0].id;
                console.log('✅ Novo contato criado via MCP:', { id: contact_id, name: result.data.contact_name });
              }
            } catch (contactError) {
              console.error('❌ Erro ao gerenciar contato:', contactError);
              throw new Error('Não foi possível criar/encontrar o contato');
            }

            mcpResult = await appointmentAgent.createAppointment({
              contact_id: contact_id,
              clinic_id: result.data.clinic_id || 1,
              user_id: result.data.user_id || 4,
              scheduled_date: result.data.date,
              scheduled_time: result.data.time,
              duration_minutes: result.data.duration || 60,
              status: 'agendada',
              payment_status: 'pendente',
              doctor_name: result.data.doctor_name || 'Marina',
              specialty: result.data.specialty || 'consulta',
              appointment_type: result.data.appointment_type || 'consulta'
            });

            if (mcpResult.success) {
              naturalResponse = `✅ Perfeito! Agendei a consulta para ${result.data.contact_name} no dia ${result.data.date} às ${result.data.time}. O agendamento #${mcpResult.appointment_id} foi criado com sucesso!`;
            } else {
              const friendlyError = mcpResult.error?.includes('conflict') 
                ? 'Este horário já está ocupado.' 
                : mcpResult.error?.includes('Contact') 
                  ? 'Erro ao processar os dados do paciente.'
                  : 'Erro interno do sistema.';

              naturalResponse = `❌ Não consegui agendar: ${friendlyError} Pode tentar outro horário ou verificar os dados?`;
            }
          } catch (error) {
            console.error('❌ Erro ao criar agendamento:', error);
            naturalResponse = '❌ Tive um problema ao agendar. Pode tentar novamente?';
          }
          break;

        case 'list':
          try {
            // Executar listagem via MCP
            mcpResult = await appointmentAgent.listAppointments(result.data.clinic_id || 1, {
              userId: result.data.user_id || 4,
              startDate: result.data.date || result.data.start_date,
              endDate: result.data.end_date
            });

            if (mcpResult.success && mcpResult.data) {
              const appointments = Array.isArray(mcpResult.data) ? mcpResult.data : [];
              if (appointments.length === 0) {
                naturalResponse = '📅 Não encontrei consultas para essa data.';
              } else {
                const appointmentsList = appointments.map((apt: any) => 
                  `• ${apt.scheduled_time} - ${apt.contact_name || 'Paciente'} ${apt.doctor_name ? `(${apt.doctor_name})` : ''}`
                ).join('\n');
                naturalResponse = `📅 Consultas encontradas:\n\n${appointmentsList}`;
              }
            } else {
              naturalResponse = '❌ Não consegui verificar os agendamentos no momento.';
            }
          } catch (error) {
            console.error('❌ Erro ao listar agendamentos:', error);
            naturalResponse = '❌ Tive um problema ao consultar a agenda.';
          }
          break;

        case 'availability':
          try {
            // Verificar disponibilidade via MCP
            mcpResult = await appointmentAgent.getAvailableSlots({
              clinic_id: result.data.clinic_id || 1,
              user_id: result.data.user_id || 4,
              date: result.data.date,
              duration_minutes: result.data.duration || 60,
              working_hours_start: '08:00',
              working_hours_end: '18:00'
            });

            console.log('🔍 Availability MCP Result:', JSON.stringify(mcpResult, null, 2));

            if (mcpResult.success && mcpResult.data) {
              const availableSlots = Array.isArray(mcpResult.data) ? mcpResult.data : [];

              if (availableSlots.length === 0) {
                naturalResponse = `❌ Não há horários disponíveis para ${result.data.date}. Que tal tentarmos outro dia?`;
              } else {
                const slots = availableSlots
                  .filter(slot => slot.available)
                  .map(slot => slot.time)
                  .slice(0, 5)
                  .join(', ');

                if (slots) {
                  naturalResponse = `✅ Horários disponíveis para ${result.data.date}:\n\n${slots}\n\nQual horário você prefere?`;
                } else {
                  naturalResponse = `❌ Todos os horários estão ocupados para ${result.data.date}. Que tal tentarmos outro dia?`;
                }
              }
            } else {
              naturalResponse = `❌ Não consegui verificar a disponibilidade para ${result.data.date}. Erro: ${mcpResult.error || 'Desconhecido'}`;
            }
          } catch (error) {
            console.error('❌ Erro ao verificar disponibilidade:', error);
            naturalResponse = `❌ Tive um problema ao verificar os horários para ${result.data.date}. Pode tentar novamente?`;
          }
          break;

        case 'clarification':
          naturalResponse = result.data.message || 'Preciso de mais informações. Pode me ajudar?';
          break;

        default:
          naturalResponse = 'Entendi sua mensagem! Como posso ajudar você?';
      }

      // Log da execução MCP se houve
      if (mcpResult) {
        mcpLogsService.addLog({
          type: 'mcp',
          level: mcpResult.success ? 'info' : 'error',
          message: `Ação MCP executada: ${action}`,
          data: { 
            sessionId,
            action,
            success: mcpResult.success,
            result: mcpResult
          }
        });
      }

      // Log da resposta da Marina
      mcpLogsService.addLog({
        type: 'mcp',
        level: 'info',
        message: `Marina respondeu: "${naturalResponse.substring(0, 100)}..."`,
        data: { 
          sessionId,
          responseLength: naturalResponse.length,
          processingTime: Date.now() - startTime
        }
      });

      res.json({
        success: true,
        data: {
          response: naturalResponse,
          action: action,
          sessionId: sessionId,
          mcp_result: mcpResult
        },
        error: null
      });
    } else {
      // Fallback para erro
      const fallbackResponse = 'Olá! Sou a Marina, sua assistente de agendamento. Como posso ajudar você hoje?';

      res.json({
        success: true,
        data: {
          response: fallbackResponse,
          action: 'chat_response',
          sessionId: sessionId
        },
        error: null
      });
    }

  } catch (error) {
    console.error('💥 Chat Error:', error);

    // Log do erro
    mcpLogsService.addLog({
      type: 'mcp',
      level: 'error',
      message: `Erro no chat: ${error.message}`,
      data: { 
        sessionId: req.body?.sessionId,
        error: error.message,
        stack: error.stack
      }
    });

    // Sempre retornar resposta amigável, mesmo em caso de erro
    res.json({
      success: true,
      data: {
        response: 'Oi! Tive um pequeno problema, mas já estou funcionando novamente. Como posso ajudar?',
        action: 'chat_response',
        sessionId: req.body?.sessionId
      },
      error: null
    });
  }
});

export default router;