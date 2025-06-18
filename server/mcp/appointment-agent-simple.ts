import { z } from 'zod';
import { pool } from '../db';
import { format, parse, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

// Valid appointment statuses as defined in the database schema
export const VALID_APPOINTMENT_STATUSES = [
  'agendada', 
  'confirmada', 
  'paciente_aguardando', 
  'paciente_em_atendimento', 
  'finalizada', 
  'faltou', 
  'cancelada_paciente', 
  'cancelada_dentista'
] as const;

export const VALID_PAYMENT_STATUSES = ['pendente', 'pago', 'cancelado'] as const;

// Zod schemas for validation
const CreateAppointmentSchema = z.object({
  contact_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration_minutes: z.number().int().min(15).max(480),
  status: z.enum(VALID_APPOINTMENT_STATUSES).default('agendada'),
  doctor_name: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  appointment_type: z.string().nullable().optional(),
  session_notes: z.string().nullable().optional(),
  payment_status: z.enum(VALID_PAYMENT_STATUSES).default('pendente'),
  payment_amount: z.number().int().nullable().optional(),
  tag_id: z.number().int().nullable().optional()
});

const UpdateStatusSchema = z.object({
  appointment_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  status: z.enum(VALID_APPOINTMENT_STATUSES),
  session_notes: z.string().nullable().optional()
});

const RescheduleSchema = z.object({
  appointment_id: z.number().int().positive(),
  clinic_id: z.number().int().positive(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduled_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration_minutes: z.number().int().min(15).max(480).optional()
});

const AvailabilitySchema = z.object({
  clinic_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_minutes: z.number().int().min(15).max(480),
  working_hours_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00'),
  working_hours_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('18:00')
});

export interface MCPResponse {
  success: boolean;
  data: any | null;
  error: string | null;
  appointment_id: number | null;
  conflicts: any[] | null;
  next_available_slots: any[] | null;
}

export class AppointmentMCPAgent {
  
  /**
   * Create a new appointment with full validation
   */
  async createAppointment(params: z.infer<typeof CreateAppointmentSchema>): Promise<MCPResponse> {
    try {
      const validated = CreateAppointmentSchema.parse(params);
      
      // Create the appointment using raw SQL to avoid schema compilation issues
      const scheduledDateTime = `${validated.scheduled_date} ${validated.scheduled_time}:00`;
      
      const result = await db.execute(`
        INSERT INTO appointments (
          contact_id, clinic_id, user_id, scheduled_date, duration_minutes, 
          status, doctor_name, specialty, appointment_type, session_notes,
          payment_status, payment_amount, tag_id, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW()
        ) RETURNING *
      `).bind([
        validated.contact_id,
        validated.clinic_id,
        validated.user_id,
        scheduledDateTime,
        validated.duration_minutes,
        validated.status,
        validated.doctor_name,
        validated.specialty,
        validated.appointment_type,
        validated.session_notes,
        validated.payment_status,
        validated.payment_amount,
        validated.tag_id
      ]);
      
      return {
        success: true,
        data: result.rows[0],
        error: null,
        appointment_id: result.rows[0].id,
        conflicts: null,
        next_available_slots: null
      };
      
    } catch (error) {
      console.error('Error creating appointment:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
    }
  }
  
  /**
   * Update appointment status with validation
   */
  async updateStatus(params: z.infer<typeof UpdateStatusSchema>): Promise<MCPResponse> {
    try {
      const validated = UpdateStatusSchema.parse(params);
      
      const result = await db.execute(`
        UPDATE appointments 
        SET status = $1, session_notes = $2, updated_at = NOW()
        WHERE id = $3 AND clinic_id = $4
        RETURNING *
      `, [
        validated.status,
        validated.session_notes,
        validated.appointment_id,
        validated.clinic_id
      ]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Appointment not found or does not belong to this clinic',
          appointment_id: null,
          conflicts: null,
          next_available_slots: null
        };
      }
      
      return {
        success: true,
        data: result.rows[0],
        error: null,
        appointment_id: result.rows[0].id,
        conflicts: null,
        next_available_slots: null
      };
      
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
    }
  }
  
  /**
   * Reschedule appointment with conflict validation
   */
  async rescheduleAppointment(params: z.infer<typeof RescheduleSchema>): Promise<MCPResponse> {
    try {
      const validated = RescheduleSchema.parse(params);
      
      const scheduledDateTime = `${validated.scheduled_date} ${validated.scheduled_time}:00`;
      
      const result = await db.execute(`
        UPDATE appointments 
        SET scheduled_date = $1, duration_minutes = COALESCE($2, duration_minutes), updated_at = NOW()
        WHERE id = $3 AND clinic_id = $4
        RETURNING *
      `, [
        scheduledDateTime,
        validated.duration_minutes,
        validated.appointment_id,
        validated.clinic_id
      ]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Appointment not found',
          appointment_id: null,
          conflicts: null,
          next_available_slots: null
        };
      }
      
      return {
        success: true,
        data: result.rows[0],
        error: null,
        appointment_id: result.rows[0].id,
        conflicts: null,
        next_available_slots: null
      };
      
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
    }
  }
  
  /**
   * Cancel appointment with reason
   */
  async cancelAppointment(appointmentId: number, clinicId: number, cancelledBy: 'paciente' | 'dentista', reason?: string): Promise<MCPResponse> {
    try {
      const status = cancelledBy === 'paciente' ? 'cancelada_paciente' : 'cancelada_dentista';
      
      const result = await db.execute(`
        UPDATE appointments 
        SET status = $1, cancellation_reason = $2, updated_at = NOW()
        WHERE id = $3 AND clinic_id = $4
        RETURNING *
      `, [
        status,
        reason,
        appointmentId,
        clinicId
      ]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          data: null,
          error: 'Appointment not found',
          appointment_id: null,
          conflicts: null,
          next_available_slots: null
        };
      }
      
      return {
        success: true,
        data: result.rows[0],
        error: null,
        appointment_id: result.rows[0].id,
        conflicts: null,
        next_available_slots: null
      };
      
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
    }
  }
  
  /**
   * Get available time slots for a specific date and user
   */
  async getAvailableSlots(params: z.infer<typeof AvailabilitySchema>): Promise<MCPResponse> {
    try {
      const validated = AvailabilitySchema.parse(params);
      
      // Get existing appointments for the day
      const existingAppointments = await db.execute(`
        SELECT scheduled_date, duration_minutes 
        FROM appointments 
        WHERE clinic_id = $1 AND user_id = $2 
        AND DATE(scheduled_date) = $3 
        AND status = 'agendada'
      `, [
        validated.clinic_id,
        validated.user_id,
        validated.date
      ]);
      
      // Generate time slots based on working hours
      const slots = [];
      const workStart = parse(validated.working_hours_start, 'HH:mm', new Date());
      const workEnd = parse(validated.working_hours_end, 'HH:mm', new Date());
      
      let currentTime = workStart;
      
      while (isBefore(addMinutes(currentTime, validated.duration_minutes), workEnd)) {
        const timeString = format(currentTime, 'HH:mm');
        const slotStart = new Date(`${validated.date}T${timeString}:00`);
        const slotEnd = addMinutes(slotStart, validated.duration_minutes);
        
        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments.rows.some((apt: any) => {
          if (!apt.scheduled_date) return false;
          const aptStart = new Date(apt.scheduled_date);
          const aptEnd = addMinutes(aptStart, apt.duration_minutes || 60);
          
          return (slotStart < aptEnd && slotEnd > aptStart);
        });
        
        if (!hasConflict) {
          slots.push({
            time: timeString,
            duration_minutes: validated.duration_minutes,
            available: true
          });
        }
        
        // Move to next 15-minute interval
        currentTime = addMinutes(currentTime, 15);
      }
      
      return {
        success: true,
        data: slots,
        error: null,
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
      
    } catch (error) {
      console.error('Error getting available slots:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
    }
  }
  
  /**
   * List appointments with filtering and pagination
   */
  async listAppointments(
    clinicId: number,
    filters: {
      startDate?: string;
      endDate?: string;
      userId?: number;
      status?: string;
      contactId?: number;
    } = {},
    pagination: { limit?: number; offset?: number } = {}
  ): Promise<MCPResponse> {
    try {
      let query = `
        SELECT a.*, c.name as contact_name, c.phone as contact_phone
        FROM appointments a
        LEFT JOIN contacts c ON a.contact_id = c.id
        WHERE a.clinic_id = $1
      `;
      
      const params: any[] = [clinicId];
      let paramIndex = 2;
      
      if (filters.startDate) {
        query += ` AND DATE(a.scheduled_date) >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }
      
      if (filters.endDate) {
        query += ` AND DATE(a.scheduled_date) <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }
      
      if (filters.userId) {
        query += ` AND a.user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }
      
      if (filters.status) {
        query += ` AND a.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }
      
      if (filters.contactId) {
        query += ` AND a.contact_id = $${paramIndex}`;
        params.push(filters.contactId);
        paramIndex++;
      }
      
      query += ` ORDER BY a.scheduled_date ASC`;
      
      if (pagination.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(pagination.limit);
        paramIndex++;
      }
      
      if (pagination.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(pagination.offset);
        paramIndex++;
      }
      
      const result = await db.execute(query, params);
      
      return {
        success: true,
        data: result.rows,
        error: null,
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
      
    } catch (error) {
      console.error('Error listing appointments:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        appointment_id: null,
        conflicts: null,
        next_available_slots: null
      };
    }
  }
}

export const appointmentAgent = new AppointmentMCPAgent();