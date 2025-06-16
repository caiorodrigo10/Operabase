
import { Router } from 'express';
import { ContactsController } from './contacts.controller';
import type { Storage } from '../../storage';

export function createContactsRoutes(storage: Storage): Router {
  const router = Router();
  const controller = new ContactsController(storage);

  // Get contacts with filters
  router.get('/contacts', controller.getContacts.bind(controller));

  // Get contact by ID
  router.get('/contacts/:id', controller.getContactById.bind(controller));

  // Create contact
  router.post('/contacts', controller.createContact.bind(controller));

  // Update contact
  router.put('/contacts/:id', controller.updateContact.bind(controller));

  // Update contact status
  router.patch('/contacts/:id/status', controller.updateContactStatus.bind(controller));

  return router;
}
