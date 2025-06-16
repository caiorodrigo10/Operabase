
import { Router } from 'express';
import { AppointmentTagsController } from './appointment-tags.controller';
import { isAuthenticated } from '../../auth';

export function createAppointmentTagsRoutes(storage: any): Router {
  const router = Router();
  const controller = new AppointmentTagsController(storage);

  // Appointment Tags routes
  router.get('/clinic/:clinicId/appointment-tags', isAuthenticated, controller.getAppointmentTags);
  router.post('/clinic/:clinicId/appointment-tags', isAuthenticated, controller.createAppointmentTag);
  router.put('/appointment-tags/:id', isAuthenticated, controller.updateAppointmentTag);
  router.delete('/appointment-tags/:id', isAuthenticated, controller.deleteAppointmentTag);

  return router;
}
