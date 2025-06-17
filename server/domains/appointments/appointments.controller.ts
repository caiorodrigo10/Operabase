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

export class AppointmentsController {
  private service: AppointmentsService;

  constructor(storage: IStorage) {
    this.service = new AppointmentsService(storage);
  }

  async getAppointments(req: Request, res: Response) {
    try {
      console.log('🚀 Appointments API called');
      const { clinic_id, status, date } = req.query;

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

      const appointments = await this.service.getAppointments(clinicId, filters);
      console.log('📊 Total appointments:', appointments.length);
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
      // Convert scheduled_date string to Date object if it's a string
      const requestData = {
        ...req.body,
        scheduled_date: typeof req.body.scheduled_date === 'string' 
          ? new Date(req.body.scheduled_date) 
          : req.body.scheduled_date
      };

      const validatedData = createAppointmentSchema.parse(requestData);
      
      // Transform validated data to match DTO interface
      const createData: CreateAppointmentDto = {
        ...validatedData,
        // Ensure null values are properly handled for tag_id
        tag_id: validatedData.tag_id === null ? undefined : validatedData.tag_id
      };
      
      const appointment = await this.service.createAppointment(createData);

      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
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
}