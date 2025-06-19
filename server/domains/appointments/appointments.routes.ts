
import { Router } from 'express';
import { AppointmentsController } from './appointments.controller';
import { isAuthenticated } from '../../auth';
import type { IStorage } from '../../storage';

export function createAppointmentsRoutes(storage: IStorage): Router {
  const router = Router();
  const controller = new AppointmentsController(storage);

  // Get appointments with filters
  router.get('/appointments', controller.getAppointments.bind(controller));

  // Get paginated appointments
  router.get('/appointments/paginated', controller.getAppointmentsPaginated.bind(controller));

  // Get appointment by ID
  router.get('/appointments/:id', controller.getAppointmentById.bind(controller));

  // Get appointments by contact
  router.get('/contacts/:contactId/appointments', controller.getAppointmentsByContact.bind(controller));

  // Create appointment
  router.post('/appointments', controller.createAppointment.bind(controller));

  // Update appointment
  router.put('/appointments/:id', controller.updateAppointment.bind(controller));

  // Update appointment status (PATCH)
  router.patch('/appointments/:id', controller.updateAppointmentStatus.bind(controller));

  // Delete appointment
  router.delete('/appointments/:id', controller.deleteAppointment.bind(controller));

  // Availability endpoints
  router.post('/availability/check', controller.checkAvailability.bind(controller));
  router.post('/availability/find-slots', controller.findAvailableTimeSlots.bind(controller));

  // Admin endpoint to reassign orphaned appointments
  router.post('/clinic/:clinic_id/appointments/reassign', controller.reassignAppointments.bind(controller));

  return router;
}
