import { eq, and, like, gte, lte, desc, asc, or } from "drizzle-orm";
import { db } from "./db";
import { 
  users, clinics, contacts, appointments, analytics_metrics, clinic_settings, ai_templates,
  type User, type InsertUser,
  type Clinic, type InsertClinic,
  type Contact, type InsertContact,
  type Appointment, type InsertAppointment,
  type AnalyticsMetric, type InsertAnalyticsMetric,
  type ClinicSetting, type InsertClinicSetting,
  type AiTemplate, type InsertAiTemplate
} from "@shared/schema";
import type { IStorage } from "./storage";

export class PostgreSQLStorage implements IStorage {
  
  // ============ USERS ============
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // ============ CLINICS ============
  
  async getClinic(id: number): Promise<Clinic | undefined> {
    const result = await db.select().from(clinics).where(eq(clinics.id, id)).limit(1);
    return result[0];
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const result = await db.insert(clinics).values(insertClinic).returning();
    return result[0];
  }

  async updateClinic(id: number, updates: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const result = await db.update(clinics)
      .set(updates)
      .where(eq(clinics.id, id))
      .returning();
    return result[0];
  }

  // ============ CONTACTS ============
  
  async getContacts(clinicId: number, filters?: { status?: string; search?: string }): Promise<Contact[]> {
    let whereClause = eq(contacts.clinic_id, clinicId);

    if (filters?.status) {
      whereClause = and(whereClause, eq(contacts.status, filters.status));
    }

    if (filters?.search) {
      const searchTerm = `%${filters.search}%`;
      whereClause = and(whereClause, or(
        like(contacts.name, searchTerm),
        like(contacts.phone, searchTerm)
      ));
    }

    const result = await db.select().from(contacts)
      .where(whereClause)
      .orderBy(desc(contacts.last_interaction));
    return result;
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    return result[0];
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const result = await db.insert(contacts).values(insertContact).returning();
    return result[0];
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const updateData = {
      ...updates,
      last_interaction: new Date()
    };

    const result = await db.update(contacts)
      .set(updateData)
      .where(eq(contacts.id, id))
      .returning();
    return result[0];
  }

  async updateContactStatus(id: number, status: string): Promise<Contact | undefined> {
    return this.updateContact(id, { status });
  }

  // ============ APPOINTMENTS ============
  
  async getAppointments(clinicId: number, filters?: { status?: string; date?: Date }): Promise<Appointment[]> {
    let whereClause = eq(appointments.clinic_id, clinicId);

    if (filters?.status) {
      whereClause = and(whereClause, eq(appointments.status, filters.status));
    }

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause = and(whereClause, 
        gte(appointments.scheduled_date, startOfDay),
        lte(appointments.scheduled_date, endOfDay)
      );
    }

    const result = await db.select().from(appointments)
      .where(whereClause)
      .orderBy(asc(appointments.scheduled_date));
    return result;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
    return result[0];
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(insertAppointment).returning();
    return result[0];
  }

  async updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date()
    };

    const result = await db.update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();
    return result[0];
  }

  async getAppointmentsByContact(contactId: number): Promise<Appointment[]> {
    const result = await db.select().from(appointments)
      .where(eq(appointments.contact_id, contactId))
      .orderBy(desc(appointments.scheduled_date));
    return result;
  }

  // ============ ANALYTICS ============
  
  async createAnalyticsMetric(insertMetric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const result = await db.insert(analytics_metrics).values(insertMetric).returning();
    return result[0];
  }

  async getAnalyticsMetrics(
    clinicId: number, 
    metricType?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    let whereClause = eq(analytics_metrics.clinic_id, clinicId);

    if (metricType) {
      whereClause = and(whereClause, eq(analytics_metrics.metric_type, metricType));
    }

    if (dateRange) {
      whereClause = and(whereClause, 
        gte(analytics_metrics.date, dateRange.start),
        lte(analytics_metrics.date, dateRange.end)
      );
    }

    const result = await db.select().from(analytics_metrics)
      .where(whereClause)
      .orderBy(desc(analytics_metrics.date));
    return result;
  }

  // ============ SETTINGS ============
  
  async getClinicSettings(clinicId: number): Promise<ClinicSetting[]> {
    const result = await db.select().from(clinic_settings)
      .where(eq(clinic_settings.clinic_id, clinicId));
    return result;
  }

  async getClinicSetting(clinicId: number, key: string): Promise<ClinicSetting | undefined> {
    const result = await db.select().from(clinic_settings)
      .where(and(
        eq(clinic_settings.clinic_id, clinicId),
        eq(clinic_settings.setting_key, key)
      ))
      .limit(1);
    return result[0];
  }

  async setClinicSetting(insertSetting: InsertClinicSetting): Promise<ClinicSetting> {
    // Try to update existing setting first
    const existing = await this.getClinicSetting(
      insertSetting.clinic_id!, 
      insertSetting.setting_key
    );

    if (existing) {
      const result = await db.update(clinic_settings)
        .set({
          setting_value: insertSetting.setting_value,
          setting_type: insertSetting.setting_type,
          description: insertSetting.description,
          updated_at: new Date()
        })
        .where(eq(clinic_settings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(clinic_settings).values(insertSetting).returning();
      return result[0];
    }
  }

  // ============ AI TEMPLATES ============
  
  async getAiTemplates(clinicId: number, templateType?: string): Promise<AiTemplate[]> {
    let whereClause = and(
      eq(ai_templates.clinic_id, clinicId),
      eq(ai_templates.is_active, true)
    );

    if (templateType) {
      whereClause = and(whereClause, eq(ai_templates.template_type, templateType));
    }

    const result = await db.select().from(ai_templates)
      .where(whereClause)
      .orderBy(asc(ai_templates.template_name));
    return result;
  }

  async getAiTemplate(id: number): Promise<AiTemplate | undefined> {
    const result = await db.select().from(ai_templates).where(eq(ai_templates.id, id)).limit(1);
    return result[0];
  }

  async createAiTemplate(insertTemplate: InsertAiTemplate): Promise<AiTemplate> {
    const result = await db.insert(ai_templates).values(insertTemplate).returning();
    return result[0];
  }

  async updateAiTemplate(id: number, updates: Partial<InsertAiTemplate>): Promise<AiTemplate | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date()
    };

    const result = await db.update(ai_templates)
      .set(updateData)
      .where(eq(ai_templates.id, id))
      .returning();
    return result[0];
  }
}

export const postgresStorage = new PostgreSQLStorage();