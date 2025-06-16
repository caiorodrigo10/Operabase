
import { Router } from 'express';
import { MedicalRecordsController } from './medical-records.controller';
import type { Storage } from '../../storage';

export function createMedicalRecordsRoutes(storage: Storage): Router {
  const router = Router();
  const controller = new MedicalRecordsController(storage);

  // Get medical records for a contact
  router.get('/medical-records', controller.getMedicalRecords.bind(controller));

  // Get medical record by ID
  router.get('/medical-records/:id', controller.getMedicalRecordById.bind(controller));

  // Create medical record
  router.post('/medical-records', controller.createMedicalRecord.bind(controller));

  // Update medical record
  router.put('/medical-records/:id', controller.updateMedicalRecord.bind(controller));

  // Delete medical record
  router.delete('/medical-records/:id', controller.deleteMedicalRecord.bind(controller));

  return router;
}
