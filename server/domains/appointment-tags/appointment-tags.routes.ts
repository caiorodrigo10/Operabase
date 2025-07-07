import { Router } from 'express';
import { AppointmentTagsController } from './appointment-tags.controller';
import { isAuthenticated, hasClinicAccess } from '../../auth';

export function createAppointmentTagsRoutes(storage: any): Router {
  const router = Router();
  const controller = new AppointmentTagsController(storage);

  // Appointment Tags routes
  router.get('/clinic/:clinicId/appointment-tags', isAuthenticated, hasClinicAccess('clinicId'), controller.getAppointmentTags.bind(controller));
  router.post('/clinic/:clinicId/appointment-tags', isAuthenticated, hasClinicAccess('clinicId'), controller.createAppointmentTag.bind(controller));
  router.put('/appointment-tags/:id', isAuthenticated, controller.updateAppointmentTag.bind(controller));
  router.delete('/appointment-tags/:id', isAuthenticated, controller.deleteAppointmentTag.bind(controller));

  return router;
}
