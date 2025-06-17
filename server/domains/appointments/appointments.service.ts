
import type { 
  Appointment, 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentFilters,
  AvailabilityRequest,
  AvailabilityResponse,
  TimeSlotRequest,
  TimeSlotResponse
} from './appointments.types';
import { AppointmentsRepository } from './appointments.repository';
import type { IStorage } from '../../storage';

export class AppointmentsService {
  private repository: AppointmentsRepository;

  constructor(private storage: IStorage) {
    this.repository = new AppointmentsRepository(storage);
  }

  async getAppointments(clinicId: number, filters: AppointmentFilters = {}): Promise<Appointment[]> {
    try {
      console.log('🚀 AppointmentsService.getAppointments called for clinic:', clinicId);
      
      // Get appointments from database
      const appointments = await this.repository.findAll(clinicId, filters);
      console.log('📊 DB appointments found:', appointments.length);
      
      return appointments;
    } catch (error) {
      console.error('💥 Error in AppointmentsService.getAppointments:', error);
      console.error('💥 Error stack:', error.stack);
      throw error;
    }
  }

  async getAppointmentById(id: number): Promise<Appointment | null> {
    return this.repository.findById(id);
  }

  async getAppointmentsByContact(contactId: number): Promise<Appointment[]> {
    return this.repository.findByContact(contactId);
  }

  async createAppointment(data: CreateAppointmentDto): Promise<Appointment> {
    try {
      const appointment = await this.repository.create(data);

      // Sync with Google Calendar if user has active integration
      try {
        await this.syncAppointmentToGoogleCalendar(appointment);
      } catch (syncError) {
        console.error("Error syncing appointment to Google Calendar:", syncError);
        // Don't fail the appointment creation if sync fails
      }

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  async updateAppointment(id: number, data: UpdateAppointmentDto): Promise<Appointment | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
    }
  }

  async updateAppointmentStatus(id: number, status: string): Promise<Appointment | null> {
    try {
      return await this.repository.updateStatus(id, status);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw new Error('Failed to update appointment status');
    }
  }

  async deleteAppointment(id: number, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get appointment before deletion for Google Calendar sync
      const appointment = await this.repository.findById(id);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Remove from Google Calendar if synced
      if (appointment.google_calendar_event_id) {
        try {
          await this.removeAppointmentFromCalendar(id, userId);
        } catch (syncError) {
          console.error("Error removing appointment from Google Calendar:", syncError);
          // Continue with deletion even if Google Calendar sync fails
        }
      }
      
      const success = await this.repository.delete(id);
      
      if (!success) {
        throw new Error('Appointment not found');
      }
      
      return { success: true, message: "Appointment deleted successfully" };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    try {
      const startDate = new Date(request.startDateTime);
      const endDate = new Date(request.endDateTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error("Invalid datetime format");
      }

      // Check if the appointment time is in the past
      const now = new Date();
      if (startDate <= now) {
        return {
          available: false,
          conflict: true,
          conflictType: 'appointment',
          conflictDetails: {
            id: 'past-time',
            title: 'Horário já passou',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString()
          }
        };
      }

      // Check for conflicts with existing appointments
      const existingAppointments = await this.repository.findByDateRange(startDate, endDate);
      
      // Filter appointments by professional if specified
      let relevantAppointments = existingAppointments;
      if (request.professionalName) {
        relevantAppointments = existingAppointments.filter(apt => 
          apt.doctor_name === request.professionalName
        );
      }
      
      let conflictingAppointment = null;
      if (request.excludeAppointmentId) {
        conflictingAppointment = relevantAppointments.find(apt => 
          apt.id !== request.excludeAppointmentId && 
          new Date(apt.scheduled_date!) < endDate &&
          new Date(apt.scheduled_date!).getTime() + ((apt.duration_minutes || 60) * 60000) > startDate.getTime()
        );
      } else {
        conflictingAppointment = relevantAppointments.find(apt => 
          new Date(apt.scheduled_date!) < endDate &&
          new Date(apt.scheduled_date!).getTime() + ((apt.duration_minutes || 60) * 60000) > startDate.getTime()
        );
      }

      if (conflictingAppointment) {
        // Get contact name for the conflicting appointment
        const contact = await this.storage.getContact(conflictingAppointment.contact_id);
        return {
          available: false,
          conflict: true,
          conflictType: 'appointment',
          conflictDetails: {
            id: conflictingAppointment.id.toString(),
            title: `${conflictingAppointment.doctor_name} - ${contact?.name || 'Paciente'}`,
            startTime: conflictingAppointment.scheduled_date.toISOString(),
            endTime: new Date(new Date(conflictingAppointment.scheduled_date!).getTime() + 
                             (conflictingAppointment.duration_minutes || 60) * 60000).toISOString()
          }
        };
      }

      // Check for Google Calendar conflicts would go here
      // TODO: Implement Google Calendar conflict checking

      return {
        available: true,
        conflict: false
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw new Error('Failed to check availability');
    }
  }

  async findAvailableTimeSlots(request: TimeSlotRequest): Promise<TimeSlotResponse> {
    try {
      const targetDate = new Date(request.date);
      if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date format");
      }

      const { duration = 60, workingHours = { start: '08:00', end: '18:00' } } = request;

      // Set up start and end of day
      const dayStart = new Date(targetDate);
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(targetDate);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      // Get all appointments for the day
      const appointments = await this.repository.findByDateRange(dayStart, dayEnd);
      
      // Convert appointments to busy blocks
      const busyBlocks: { start: Date; end: Date; type: string; title: string }[] = [];
      
      appointments.forEach(apt => {
        if (apt.scheduled_date && apt.status !== 'cancelled') {
          const start = new Date(apt.scheduled_date);
          const end = new Date(start.getTime() + (apt.duration_minutes || 60) * 60000);
          busyBlocks.push({
            start,
            end,
            type: 'appointment',
            title: `${apt.doctor_name} - Consulta`
          });
        }
      });

      // Sort busy blocks by start time
      busyBlocks.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Find available slots
      const availableSlots: { startTime: string; endTime: string; duration: number }[] = [];
      const slotDuration = duration * 60000; // Convert to milliseconds

      // For today, start from current time if it's later than work start
      let currentTime = new Date(dayStart);
      const now = new Date();
      const isToday = targetDate.toDateString() === now.toDateString();
      
      if (isToday && now > dayStart) {
        // Round up to next 30-minute slot
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const nextSlotMinutes = Math.ceil(currentMinutes / 30) * 30;
        const nextSlotTime = new Date(targetDate);
        nextSlotTime.setHours(Math.floor(nextSlotMinutes / 60), nextSlotMinutes % 60, 0, 0);
        
        currentTime = nextSlotTime > dayStart ? nextSlotTime : dayStart;
      }

      for (const block of busyBlocks) {
        // Check if there's a gap before this block
        if (currentTime < block.start) {
          // Create slots in this gap
          let slotStart = new Date(currentTime);
          while (slotStart.getTime() + slotDuration <= block.start.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration);
            availableSlots.push({
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              duration
            });
            slotStart = new Date(slotStart.getTime() + slotDuration);
          }
        }
        
        // Update current time to after this block
        currentTime = new Date(Math.max(currentTime.getTime(), block.end.getTime()));
      }

      // Check for slots after the last block until end of day
      if (currentTime < dayEnd) {
        let slotStart = new Date(currentTime);
        while (slotStart.getTime() + slotDuration <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration);
          availableSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            duration
          });
          slotStart = new Date(slotStart.getTime() + slotDuration);
        }
      }

      return {
        date: targetDate.toISOString().split('T')[0],
        duration,
        workingHours,
        availableSlots,
        busyBlocks: busyBlocks.map(block => ({
          startTime: block.start.toISOString(),
          endTime: block.end.toISOString(),
          type: block.type,
          title: block.title
        }))
      };
    } catch (error) {
      console.error('Error finding available slots:', error);
      throw new Error('Failed to find available slots');
    }
  }

  private async mergeWithGoogleCalendarEvents(clinicId: number, appointments: Appointment[], filters: AppointmentFilters): Promise<Appointment[]> {
    // Simple implementation - in production this would integrate with Google Calendar service
    return [...appointments];
  }

  private async syncAppointmentToGoogleCalendar(appointment: Appointment): Promise<void> {
    // Implementation would sync to Google Calendar
    console.log('TODO: Sync appointment to Google Calendar:', appointment.id);
  }

  private async removeAppointmentFromCalendar(appointmentId: number, userId: string): Promise<void> {
    // Implementation would remove from Google Calendar
    console.log('TODO: Remove appointment from Google Calendar:', appointmentId);
  }
}
