import { Router } from 'express';
import { createAuthRoutes } from '../../domains/auth/auth.routes';
import { createAppointmentsRoutes } from '../../domains/appointments/appointments.routes';
import { createContactsRoutes } from '../../domains/contacts/contacts.routes';
import { createClinicsRoutes } from '../../domains/clinics/clinics.routes';
import { createCalendarRoutes } from '../../domains/calendar/calendar.routes';
import { createMedicalRecordsRoutes } from '../../domains/medical-records/medical-records.routes';
import { createPipelineRoutes } from '../../domains/pipeline/pipeline.routes';
import { createAnalyticsRoutes } from '../../domains/analytics/analytics.routes';

export function createApiRouter(storage: any): Router {
  const apiRouter = Router();

  // Health check
  apiRouter.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: 'v1'
    });
  });

  // Auth domain routes
  const authRoutes = createAuthRoutes(storage);
  apiRouter.use('/', authRoutes);

  // Appointments domain routes
  const appointmentsRoutes = createAppointmentsRoutes(storage);
  apiRouter.use('/', appointmentsRoutes);

  // Contacts domain routes
  const contactsRoutes = createContactsRoutes(storage);
  apiRouter.use('/', contactsRoutes);

  // Clinics domain routes
  const clinicsRoutes = createClinicsRoutes(storage);
  apiRouter.use('/', clinicsRoutes);

  // Calendar domain routes
  const calendarRoutes = createCalendarRoutes(storage);
  apiRouter.use('/', calendarRoutes);

  // Medical Records domain routes
  const medicalRecordsRoutes = createMedicalRecordsRoutes(storage);
  apiRouter.use('/', medicalRecordsRoutes);

  // Pipeline domain routes
  const pipelineRoutes = createPipelineRoutes(storage);
  apiRouter.use('/', pipelineRoutes);

  // Analytics domain routes
  const analyticsRoutes = createAnalyticsRoutes(storage);
  apiRouter.use('/', analyticsRoutes);

  // TODO: Add other domain routes as they are migrated

  return apiRouter;
}