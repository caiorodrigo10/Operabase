
import { Router } from 'express';
import { createAuthRoutes } from '../../domains/auth/auth.routes';
import { createAppointmentsRoutes } from '../../domains/appointments/appointments.routes';

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

  // TODO: Add other domain routes as they are migrated
  // apiRouter.use('/', createContactsRoutes(storage));
  // apiRouter.use('/', createClinicsRoutes(storage));
  // apiRouter.use('/', createCalendarRoutes(storage));
  // apiRouter.use('/', createMedicalRecordsRoutes(storage));
  // apiRouter.use('/', createPipelineRoutes(storage));
  // apiRouter.use('/', createAnalyticsRoutes(storage));

  return apiRouter;
}
