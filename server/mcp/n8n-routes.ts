import { Router, Request, Response } from 'express';
import { appointmentAgent, VALID_APPOINTMENT_STATUSES, VALID_PAYMENT_STATUSES } from './appointment-agent-simple';
import { chatInterpreter } from './chat-interpreter';
import { z } from 'zod';

const router = Router();

// Request validation middleware
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: any) => {
    try {
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

/**
 * POST /api/mcp/appointments/create
 * Create a new appointment with full validation
 */
router.post('/appointments/create', validateRequest(CreateAppointmentRequestSchema), async (req: Request, res: Response) => {
  try {
    const result = await appointmentAgent.createAppointment(req.body);
    
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
});

/**
 * PUT /api/mcp/appointments/status
 * Update appointment status
 */
router.put('/appointments/status', validateRequest(UpdateStatusRequestSchema), async (req: Request, res: Response) => {
  try {
    const result = await appointmentAgent.updateStatus(req.body);
    
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
});

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

router.post('/chat/interpret', validateRequest(ChatMessageSchema), async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body;
    
    console.log('Chat interpret request:', { message, sessionId });
    
    const result = await chatInterpreter.interpretMessage(message, sessionId);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        error: null,
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      });
    } else {
      res.status(400).json({
        success: false,
        data: null,
        error: result.error,
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      });
    }
  } catch (error) {
    console.error('Chat interpret error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Internal server error',
      appointment_id: null,
      conflicts: null,
      next_available_slots: null
    });
  }
});

export default router;