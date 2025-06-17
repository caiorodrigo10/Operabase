
import { Router } from 'express';
import { AppointmentTagsController } from './appointment-tags.controller';
import { isAuthenticated, hasClinicAccess } from '../../auth';

export function createAppointmentTagsRoutes(storage: any): Router {
  const router = Router();
  const controller = new AppointmentTagsController(storage);

  // Appointment Tags routes
  router.get('/clinic/:clinicId/appointment-tags', isAuthenticated, hasClinicAccess('clinicId'), controller.getAppointmentTags);
  router.post('/clinic/:clinicId/appointment-tags', isAuthenticated, hasClinicAccess('clinicId'), controller.createAppointmentTag);
  router.put('/appointment-tags/:id', isAuthenticated, controller.updateAppointmentTag);
  router.delete('/appointment-tags/:id', isAuthenticated, controller.deleteAppointmentTag);

  return router;
}
