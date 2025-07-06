
import { Router } from 'express';
import { ContactsController } from './contacts.controller';
import { contactLogsMiddleware } from '../../middleware/system-logs.middleware';
import { isAuthenticated } from '../../auth';
import type { Storage } from '../../storage';

export function createContactsRoutes(storage: Storage): Router {
  const router = Router();
  const controller = new ContactsController(storage);

  // Get contacts with filters
  router.get('/contacts', isAuthenticated, controller.getContacts.bind(controller));

  // Get paginated contacts
  router.get('/contacts/paginated', isAuthenticated, controller.getContactsPaginated.bind(controller));

  // Get contact by ID
  router.get('/contacts/:id', isAuthenticated, controller.getContactById.bind(controller));

  // Create contact (with logging)
  router.post('/contacts', ...contactLogsMiddleware, controller.createContact.bind(controller));

  // Update contact (with logging)
  router.put('/contacts/:id', ...contactLogsMiddleware, controller.updateContact.bind(controller));

  // Update contact status (with logging)
  router.patch('/contacts/:id/status', ...contactLogsMiddleware, controller.updateContactStatus.bind(controller));

  return router;
}
