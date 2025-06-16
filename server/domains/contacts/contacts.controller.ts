import { Request, Response } from 'express';
import { ContactsService } from './contacts.service';
import { ContactsRepository } from './contacts.repository';
import { createContactSchema, updateContactSchema, contactStatusUpdateSchema } from './contacts.types';

export class ContactsController {
  private service: ContactsService;

  constructor(storage: any) {
    const repository = new ContactsRepository(storage);
    this.service = new ContactsService(repository);
  }

  async getContacts(req: Request, res: Response) {
    try {
      const { clinic_id, status, search } = req.query;

      if (!clinic_id) {
        return res.status(400).json({ error: "clinic_id is required" });
      }

      const clinicId = parseInt(clinic_id as string);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }

      const filters: any = {};
      if (status) filters.status = status as string;
      if (search) filters.search = search as string;

      const contacts = await this.service.getContacts(clinicId, filters);
      res.json(contacts);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async getContactById(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const contact = await this.service.getContactById(contactId);
      res.json(contact);
    } catch (error: any) {
      console.error("Error fetching contact:", error);
      if (error.message === 'Contact not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async createContact(req: Request, res: Response) {
    try {
      console.log('🚀 POST /api/contacts - Starting contact creation');
      console.log('📥 Raw request body:', req.body);

      const validatedData = createContactSchema.parse(req.body);
      console.log('✅ Data validation successful:', validatedData);

      const contact = await this.service.createContact(validatedData);
      console.log('✅ Contact created successfully:', contact);

      res.status(201).json(contact);
    } catch (error: any) {
      console.error('❌ Error in POST /api/contacts:', error);

      if (error.name === 'ZodError') {
        console.error('📋 Zod validation errors:', error.errors);
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }

      console.error("💥 Database/Server error creating contact:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async updateContact(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const validatedData = updateContactSchema.parse(req.body);
      const contact = await this.service.updateContact(contactId, validatedData);

      res.json(contact);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }

      console.error("Error updating contact:", error);
      if (error.message === 'Contact not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }

  async updateContactStatus(req: Request, res: Response) {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }

      const { status } = contactStatusUpdateSchema.parse(req.body);
      const contact = await this.service.updateContactStatus(contactId, status);

      res.json(contact);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }

      console.error("Error updating contact status:", error);
      if (error.message === 'Contact not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
}