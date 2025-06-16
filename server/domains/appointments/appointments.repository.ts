
import type { Storage } from '../../storage';
import type { 
  Appointment, 
  CreateAppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentFilters 
} from './appointments.types';

export class AppointmentsRepository {
  constructor(private storage: Storage) {}

  async findAll(clinicId: number, filters: AppointmentFilters = {}): Promise<Appointment[]> {
    return this.storage.getAppointments(clinicId, filters);
  }

  async findById(id: number): Promise<Appointment | null> {
    return this.storage.getAppointment(id);
  }

  async findByContact(contactId: number): Promise<Appointment[]> {
    return this.storage.getAppointmentsByContact(contactId);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return this.storage.getAppointmentsByDateRange(startDate, endDate);
  }

  async create(data: CreateAppointmentDto): Promise<Appointment> {
    return this.storage.createAppointment(data);
  }

  async update(id: number, data: UpdateAppointmentDto): Promise<Appointment | null> {
    return this.storage.updateAppointment(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.storage.deleteAppointment(id);
  }

  async updateStatus(id: number, status: string): Promise<Appointment | null> {
    return this.storage.updateAppointment(id, { status });
  }
}
