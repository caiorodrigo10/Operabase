
import { z } from 'zod';

// Base appointment type
export interface Appointment {
  id: number;
  contact_id: number;
  user_id: string;
  clinic_id: number;
  doctor_name: string;
  specialty: string;
  appointment_type: string;
  scheduled_date: Date;
  duration_minutes: number;
  status: string;
  payment_status: string;
  payment_amount: number;
  session_notes?: string;
  created_at: Date;
  updated_at: Date;
  google_calendar_event_id?: string;
  is_google_calendar_event?: boolean;
}

// DTOs for requests
export interface CreateAppointmentDto {
  contact_id: number;
  user_id: string | number;
  clinic_id: number;
  type: string;
  scheduled_date: string;
  scheduled_time: string;
  duration: number;
  notes?: string | null;
  tag_id?: number;
  status?: string;
  payment_status?: string;
  location?: string | null;
  price?: number | null;
}

export interface UpdateAppointmentDto {
  id: number;
  contact_id?: number;
  user_id?: string | number;
  clinic_id?: number;
  type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration?: number;
  status?: string;
  payment_status?: string;
  notes?: string | null;
  location?: string | null;
  price?: number | null;
  tag_id?: number;
}

export interface AppointmentFilters {
  status?: string;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export interface AvailabilityRequest {
  startDateTime: string;
  endDateTime: string;
  excludeAppointmentId?: number;
  professionalName?: string;
}

export interface AvailabilityResponse {
  available: boolean;
  conflict: boolean;
  conflictType?: 'appointment' | 'google_calendar';
  conflictDetails?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
  };
}

export interface TimeSlotRequest {
  date: string;
  duration?: number;
  workingHours?: {
    start: string;
    end: string;
  };
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

export interface TimeSlotResponse {
  date: string;
  duration: number;
  workingHours: {
    start: string;
    end: string;
  };
  availableSlots: TimeSlot[];
  busyBlocks: {
    startTime: string;
    endTime: string;
    type: string;
    title: string;
  }[];
}

// Validation schemas
export const createAppointmentSchema = z.object({
  contact_id: z.number(),
  user_id: z.string(),
  clinic_id: z.number(),
  doctor_name: z.string(),
  specialty: z.string(),
  appointment_type: z.string(),
  scheduled_date: z.date(),
  duration_minutes: z.number(),
  status: z.string(),
  payment_status: z.string(),
  payment_amount: z.number(),
  session_notes: z.string().optional()
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const availabilityRequestSchema = z.object({
  startDateTime: z.string(),
  endDateTime: z.string(),
  excludeAppointmentId: z.number().optional(),
  professionalName: z.string().optional()
});

export const timeSlotRequestSchema = z.object({
  date: z.string(),
  duration: z.number().default(60),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }).default({ start: '08:00', end: '18:00' })
});
