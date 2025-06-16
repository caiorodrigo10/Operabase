
import { Router } from 'express';
import { createAuthRoutes } from '../../domains/auth/auth.routes';

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

  // TODO: Add other domain routes as they are migrated
  // apiRouter.use('/', createAppointmentsRoutes(storage));
  // apiRouter.use('/', createContactsRoutes(storage));
  // apiRouter.use('/', createClinicsRoutes(storage));
  // apiRouter.use('/', createCalendarRoutes(storage));
  // apiRouter.use('/', createMedicalRecordsRoutes(storage));
  // apiRouter.use('/', createPipelineRoutes(storage));
  // apiRouter.use('/', createAnalyticsRoutes(storage));

  return apiRouter;
}
