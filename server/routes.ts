import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClinicSchema, insertContactSchema, insertAppointmentSchema,
  insertAnalyticsMetricSchema, insertClinicSettingSchema, insertAiTemplateSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============ CLINICS ============
  
  // Get clinic by ID
  app.get("/api/clinics/:id", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.id);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const clinic = await storage.getClinic(clinicId);
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      
      res.json(clinic);
    } catch (error) {
      console.error("Error fetching clinic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create clinic
  app.post("/api/clinics", async (req, res) => {
    try {
      const validatedData = insertClinicSchema.parse(req.body);
      const clinic = await storage.createClinic(validatedData);
      res.status(201).json(clinic);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating clinic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update clinic
  app.put("/api/clinics/:id", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.id);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const validatedData = insertClinicSchema.partial().parse(req.body);
      const clinic = await storage.updateClinic(clinicId, validatedData);
      
      if (!clinic) {
        return res.status(404).json({ error: "Clinic not found" });
      }
      
      res.json(clinic);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating clinic:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ CONTACTS ============
  
  // Get contacts with filters
  app.get("/api/contacts", async (req, res) => {
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
      
      const contacts = await storage.getContacts(clinicId, filters);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get contact by ID
  app.get("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }
      
      const contact = await storage.getContact(contactId);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create contact
  app.post("/api/contacts", async (req, res) => {
    try {
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update contact
  app.put("/api/contacts/:id", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }
      
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(contactId, validatedData);
      
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update contact status
  app.patch("/api/contacts/:id/status", async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }
      
      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: "Valid status is required" });
      }
      
      const contact = await storage.updateContactStatus(contactId, status);
      
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      
      res.json(contact);
    } catch (error) {
      console.error("Error updating contact status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ APPOINTMENTS ============
  
  // Get appointments with filters
  app.get("/api/appointments", async (req, res) => {
    try {
      const { clinic_id, status, date } = req.query;
      
      if (!clinic_id) {
        return res.status(400).json({ error: "clinic_id is required" });
      }
      
      const clinicId = parseInt(clinic_id as string);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (date) filters.date = new Date(date as string);
      
      const appointments = await storage.getAppointments(clinicId, filters);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get appointment by ID
  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get appointments by contact
  app.get("/api/contacts/:contactId/appointments", async (req, res) => {
    try {
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) {
        return res.status(400).json({ error: "Invalid contact ID" });
      }
      
      const appointments = await storage.getAppointmentsByContact(contactId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments by contact:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create appointment
  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update appointment
  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: "Invalid appointment ID" });
      }
      
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(appointmentId, validatedData);
      
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ ANALYTICS ============
  
  // Get analytics metrics
  app.get("/api/analytics", async (req, res) => {
    try {
      const { clinic_id, metric_type, start_date, end_date } = req.query;
      
      if (!clinic_id) {
        return res.status(400).json({ error: "clinic_id is required" });
      }
      
      const clinicId = parseInt(clinic_id as string);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      let dateRange: { start: Date; end: Date } | undefined;
      if (start_date && end_date) {
        dateRange = {
          start: new Date(start_date as string),
          end: new Date(end_date as string)
        };
      }
      
      const metrics = await storage.getAnalyticsMetrics(
        clinicId, 
        metric_type as string, 
        dateRange
      );
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create analytics metric
  app.post("/api/analytics", async (req, res) => {
    try {
      const validatedData = insertAnalyticsMetricSchema.parse(req.body);
      const metric = await storage.createAnalyticsMetric(validatedData);
      res.status(201).json(metric);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating analytics metric:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ SETTINGS ============
  
  // Get clinic settings
  app.get("/api/clinics/:clinicId/settings", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const settings = await storage.getClinicSettings(clinicId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching clinic settings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get specific clinic setting
  app.get("/api/clinics/:clinicId/settings/:key", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const { key } = req.params;
      const setting = await storage.getClinicSetting(clinicId, key);
      
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching clinic setting:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Set clinic setting
  app.post("/api/clinics/:clinicId/settings", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const validatedData = insertClinicSettingSchema.parse({
        ...req.body,
        clinic_id: clinicId
      });
      
      const setting = await storage.setClinicSetting(validatedData);
      res.status(201).json(setting);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error setting clinic setting:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============ AI TEMPLATES ============
  
  // Get AI templates
  app.get("/api/clinics/:clinicId/ai-templates", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const { template_type } = req.query;
      const templates = await storage.getAiTemplates(clinicId, template_type as string);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching AI templates:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get AI template by ID
  app.get("/api/ai-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const template = await storage.getAiTemplate(templateId);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching AI template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Create AI template
  app.post("/api/clinics/:clinicId/ai-templates", async (req, res) => {
    try {
      const clinicId = parseInt(req.params.clinicId);
      if (isNaN(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
      }
      
      const validatedData = insertAiTemplateSchema.parse({
        ...req.body,
        clinic_id: clinicId
      });
      
      const template = await storage.createAiTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating AI template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update AI template
  app.put("/api/ai-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ error: "Invalid template ID" });
      }
      
      const validatedData = insertAiTemplateSchema.partial().parse(req.body);
      const template = await storage.updateAiTemplate(templateId, validatedData);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating AI template:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
