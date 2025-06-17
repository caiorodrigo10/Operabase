
import { Router } from 'express';
import { ClinicsController } from './clinics.controller';
import { supabaseAuth } from '../../supabase-auth';
import { getClinicUsersForManagement } from '../../permissions-routes';
import type { IStorage } from '../../storage';

export function createClinicsRoutes(storage: IStorage): Router {
  const router = Router();
  const controller = new ClinicsController(storage);

  // Get clinic by ID
  router.get('/clinics/:id', controller.getClinicById.bind(controller));

  // Create clinic
  router.post('/clinics', controller.createClinic.bind(controller));

  // Update clinic
  router.put('/clinics/:id', controller.updateClinic.bind(controller));

  // Get clinic users
  router.get('/clinic/:id/users', controller.getClinicUsers.bind(controller));

  // Get clinic users for management (with detailed info)
  router.get('/clinic/:clinicId/users/management', getClinicUsersForManagement as any);

  // Create new user in clinic
  router.post('/clinic/:clinicId/users', supabaseAuth as any, controller.createUserInClinic.bind(controller));

  // Delete user from clinic
  router.delete('/clinic/:clinicId/users/:userId', supabaseAuth as any, controller.removeUserFromClinic.bind(controller));

  // Get clinic configuration (alias for clinic by ID)
  router.get('/clinic/:id/config', controller.getClinicById.bind(controller));

  // Update clinic configuration (alias for update clinic)
  router.put('/clinic/:id/config', controller.updateClinic.bind(controller));

  return router;
}
