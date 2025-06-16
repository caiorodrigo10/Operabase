
import { Router } from 'express';
import { createAuthRoutes } from '../../domains/auth/auth.routes';
import { createAppointmentsRoutes } from '../../domains/appointments/appointments.routes';
import { createContactsRoutes } from '../../domains/contacts/contacts.routes';
import { createClinicsRoutes } from '../../domains/clinics/clinics.routes';

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

  // TODO: Add other domain routes as they are migrated
  // apiRouter.use('/', createCalendarRoutes(storage));
  // apiRouter.use('/', createMedicalRecordsRoutes(storage));
  // apiRouter.use('/', createPipelineRoutes(storage));
  // apiRouter.use('/', createAnalyticsRoutes(storage));

  return apiRouter;
}
