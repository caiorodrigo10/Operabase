import { Request, Response } from 'express';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { 
  createAppointmentSchema, 
  updateAppointmentSchema,
  updateAppointmentStatusSchema
} from '../../shared/schemas/index';
import { 
  availabilityRequestSchema,
  timeSlotRequestSchema,
  type CreateAppointmentDto,
  type UpdateAppointmentDto
} from './appointments.types';
import type { IStorage } from '../../storage';
import { createClient } from '@supabase/supabase-js';
import { systemLogsService } from '../../services/system-logs.service';

export class AppointmentsController {
  private service: AppointmentsService;

  constructor(storage: IStorage) {
    this.service = new AppointmentsService(storage);
  }

  async getAppointments(req: Request, res: Response) {
    try {
      console.log('🚀 Appointments API called');
      const { clinic_id, status, date, contact_id } = req.query;
      console.log('📋 Query parameters:', { clinic_id, status, date, contact_id });

      if (!clinic_id) {
        return res.status(400).json({ error: "clinic_id is required" });
      }

      const clinicId = parseInt(clinic_id as string);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      const filters: any = {};
      if (status) filters.status = status as string;
      if (date) filters.date = new Date(date as string);
      if (contact_id) {
        const contactIdNum = parseInt(contact_id as string);
        if (!isNaN(contactIdNum)) {
          filters.contact_id = contactIdNum;
          console.log('✅ Added contact_id filter:', contactIdNum);
        }
      }

      console.log('🔍 Applied filters:', filters);
      const appointments = await this.service.getAppointments(clinicId, filters);
      console.log('📊 Total appointments found:', appointments.length);
      res.json(appointments);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch appointments' });
    }
  }

  async getAppointmentById(req: Request, res: Response) {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }

      const appointment = await this.service.getAppointmentById(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error: any) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async getAppointmentsByContact(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const appointments = await this.service.getAppointmentsByContact(contactId);
      res.json(appointments);
    } catch (error: any) {
      console.error("Error fetching appointments by contact:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async createAppointment(req: Request, res: Response) {
    try {
      // Preprocess data to handle common issues
      const preprocessedData = {
        ...req.body,
        // Ensure required fields are present
        scheduled_date: req.body.scheduled_date || req.body.date,
        scheduled_time: req.body.scheduled_time || req.body.time,
        // Handle legacy field mappings
        type: req.body.type || req.body.appointment_type || 'consulta',
        duration: req.body.duration || req.body.duration_minutes || 60,
        // Handle null/undefined values
        tag_id: req.body.tag_id === null || req.body.tag_id === undefined ? null : req.body.tag_id,
        notes: req.body.notes || req.body.session_notes || null,
        payment_amount: req.body.payment_amount || req.body.price || null
      };

      console.log('🔍 Preprocessed appointment data:', preprocessedData);

      const validatedData = createAppointmentSchema.parse(preprocessedData);
      
      // Transform validated data to match DTO interface
      const createData: CreateAppointmentDto = {
        ...validatedData,
        // Ensure null values are properly handled for tag_id
        tag_id: validatedData.tag_id === null ? undefined : validatedData.tag_id
      };
      
      const appointment = await this.service.createAppointment(createData);

      // Log the appointment creation
      const userId = (req as any).user?.id;
      const userName = (req as any).user?.name;
      console.log('📝 Logging appointment creation with user:', { userId, userName });
      
      try {
        await systemLogsService.logAppointmentAction(
          'created',
          appointment.id,
          appointment.clinic_id,
          userId,
          'professional',
          null,
          appointment,
          {
            source: 'web',
            actor_name: userName,
            professional_id: appointment.user_id,
            related_entity_id: appointment.contact_id,
            ip_address: req.ip,
            user_agent: req.headers['user-agent'],
            session_id: req.sessionID
          }
        );
        console.log('✅ Appointment log created successfully');
      } catch (logError) {
        console.error('❌ Error logging appointment:', logError);
      }

      // Create action notification for the conversation
      await this.createAppointmentActionNotification(appointment, userName);

      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        console.error('🚨 Validation error:', error.errors);
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async updateAppointment(req: Request, res: Response) {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }

      const validatedData = updateAppointmentSchema.parse(req.body);
      
      // Transform validated data to match DTO interface
      const updateData: UpdateAppointmentDto = {
        ...validatedData,
        id: appointmentId,
        // Ensure null values are properly handled for tag_id
        tag_id: validatedData.tag_id === null ? undefined : validatedData.tag_id
      };
      
      const appointment = await this.service.updateAppointment(appointmentId, updateData);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async updateAppointmentStatus(req: Request, res: Response) {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }

      // Only allow status updates via PATCH
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const appointment = await this.service.updateAppointmentStatus(appointmentId, status.toString());

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error: any) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async deleteAppointment(req: Request, res: Response) {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }

      // Get user ID from authenticated request
      const userId = (req as any).user?.id || '';

      const result = await this.service.deleteAppointment(appointmentId, userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error deleting appointment:", error);
      if (error.message === 'Appointment not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async reassignAppointments(req: Request, res: Response) {
    try {
      const { clinic_id } = req.params;
      const clinicId = parseInt(clinic_id);
      
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      console.log('🔧 Starting appointment reassignment for clinic:', clinicId);

      const result = await this.service.reassignOrphanedAppointments(clinicId);
      
      console.log('✅ Appointment reassignment completed:', result);
      res.json(result);
    } catch (error: any) {
      console.error("Error reassigning appointments:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async checkAvailability(req: Request, res: Response) {
    try {
      const validatedData = availabilityRequestSchema.parse(req.body);
      const result = await this.service.checkAvailability(validatedData);
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error checking availability:', error);
      res.status(500).json({ error: error.message || 'Failed to check availability' });
    }
  }

  async findAvailableTimeSlots(req: Request, res: Response) {
    try {
      const validatedData = timeSlotRequestSchema.parse(req.body);
      const result = await this.service.findAvailableTimeSlots(validatedData);
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error finding available slots:', error);
      res.status(500).json({ error: error.message || 'Failed to find available slots' });
    }
  }

  async getAppointmentsPaginated(req: Request, res: Response) {
    try {
      const { clinic_id, page = 1, limit = 25, status, professional_id } = req.query;
      
      if (!clinic_id) {
        return res.status(400).json({ error: 'clinic_id is required' });
      }

      const clinicId = parseInt(clinic_id as string);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: 'Invalid clinic ID' });
      }

      const paginationParams = {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string)
      };

      const filters = {
        status: status as string,
        professional_id: professional_id ? parseInt(professional_id as string) : undefined
      };

      const result = await this.service.getAppointmentsPaginated(
        clinicId,
        paginationParams,
        filters
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching paginated appointments:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch appointments' });
    }
  }

  private async createAppointmentActionNotification(appointment: any, currentUserName?: string) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Find conversation for this contact
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .eq('contact_id', appointment.contact_id)
        .eq('clinic_id', appointment.clinic_id)
        .single();

      if (convError || !conversation) {
        console.log('⚠️ No conversation found for contact:', appointment.contact_id);
        return;
      }

      // Get contact and user names for description
      const { data: contact } = await supabase
        .from('contacts')
        .select('name')
        .eq('id', appointment.contact_id)
        .single();

      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', appointment.user_id)
        .single();

      const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit'
        });
      };

      const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      // Create action notification
      const actionData = {
        clinic_id: appointment.clinic_id,
        conversation_id: conversation.id,
        action_type: 'appointment_created',
        title: 'Consulta agendada',
        description: `Consulta agendada para ${formatDate(appointment.scheduled_date)} às ${formatTime(appointment.scheduled_date)} com ${user?.name || currentUserName || 'Dr. Caio Rodrigo'}`,
        metadata: {
          appointment_id: appointment.id,
          doctor_name: user?.name || currentUserName || 'Dr. Caio Rodrigo',
          date: formatDate(appointment.scheduled_date),
          time: formatTime(appointment.scheduled_date),
          specialty: appointment.specialty || 'Consulta'
        },
        related_entity_type: 'appointment',
        related_entity_id: appointment.id
      };

      console.log('📝 Creating action notification with data:', actionData);
      
      const { data: insertData, error: insertError } = await supabase
        .from('conversation_actions')
        .insert(actionData)
        .select();

      if (insertError) {
        console.error('❌ Error creating action notification:', insertError);
        console.error('❌ Failed data:', actionData);
      } else {
        console.log('✅ Action notification created:', insertData);
      }
    } catch (error) {
      console.error('❌ Error in createAppointmentActionNotification:', error);
    }
  }
}