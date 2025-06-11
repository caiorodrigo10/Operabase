import { eq, and, like, gte, lte, desc, asc, or } from "drizzle-orm";
import { db } from "./db";
import { 
  users, clinics, contacts, appointments, analytics_metrics, clinic_settings, ai_templates,
  pipeline_stages, pipeline_opportunities, pipeline_history, pipeline_activities,
  clinic_users, clinic_invitations,
  type User, type InsertUser,
  type Clinic, type InsertClinic,
  type Contact, type InsertContact,
  type Appointment, type InsertAppointment,
  type AnalyticsMetric, type InsertAnalyticsMetric,
  type ClinicSetting, type InsertClinicSetting,
  type AiTemplate, type InsertAiTemplate,
  type PipelineStage, type InsertPipelineStage,
  type PipelineOpportunity, type InsertPipelineOpportunity,
  type PipelineHistory, type InsertPipelineHistory,
  type PipelineActivity, type InsertPipelineActivity,
  type ClinicUser, type InsertClinicUser,
  type ClinicInvitation, type InsertClinicInvitation
} from "@shared/schema";
import type { IStorage } from "./storage";

export class PostgreSQLStorage implements IStorage {
  
  // ============ USERS ============
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // ============ CLINIC USERS & ACCESS CONTROL ============

  async getUserClinics(userId: number): Promise<(ClinicUser & { clinic: Clinic })[]> {
    const result = await db
      .select()
      .from(clinic_users)
      .innerJoin(clinics, eq(clinic_users.clinic_id, clinics.id))
      .where(and(
        eq(clinic_users.user_id, userId),
        eq(clinic_users.is_active, true)
      ));
    
    return result.map(row => ({
      ...row.clinic_users,
      clinic: row.clinics
    }));
  }

  async addUserToClinic(clinicUser: InsertClinicUser): Promise<ClinicUser> {
    const result = await db.insert(clinic_users).values(clinicUser).returning();
    return result[0];
  }

  async updateClinicUserRole(clinicId: number, userId: number, role: string, permissions?: any): Promise<ClinicUser | undefined> {
    const result = await db.update(clinic_users)
      .set({ role, permissions })
      .where(and(
        eq(clinic_users.clinic_id, clinicId),
        eq(clinic_users.user_id, userId)
      ))
      .returning();
    return result[0];
  }

  async removeUserFromClinic(clinicId: number, userId: number): Promise<boolean> {
    const result = await db.delete(clinic_users)
      .where(and(
        eq(clinic_users.clinic_id, clinicId),
        eq(clinic_users.user_id, userId)
      ));
    return result.rowCount > 0;
  }

  async userHasClinicAccess(userId: number, clinicId: number): Promise<boolean> {
    const result = await db
      .select({ id: clinic_users.id })
      .from(clinic_users)
      .where(and(
        eq(clinic_users.user_id, userId),
        eq(clinic_users.clinic_id, clinicId),
        eq(clinic_users.is_active, true)
      ))
      .limit(1);
    return result.length > 0;
  }

  // ============ CLINIC INVITATIONS ============

  async createClinicInvitation(invitation: InsertClinicInvitation): Promise<ClinicInvitation> {
    const result = await db.insert(clinic_invitations).values(invitation).returning();
    return result[0];
  }

  async getClinicInvitation(token: string): Promise<ClinicInvitation | undefined> {
    const result = await db
      .select()
      .from(clinic_invitations)
      .where(eq(clinic_invitations.token, token))
      .limit(1);
    return result[0];
  }

  async acceptClinicInvitation(token: string, userId: number): Promise<ClinicUser | undefined> {
    // Start transaction
    return await db.transaction(async (tx) => {
      // Get invitation
      const invitation = await tx
        .select()
        .from(clinic_invitations)
        .where(eq(clinic_invitations.token, token))
        .limit(1);
      
      if (!invitation[0] || invitation[0].accepted_at || invitation[0].expires_at < new Date()) {
        return undefined;
      }

      // Mark invitation as accepted
      await tx.update(clinic_invitations)
        .set({ accepted_at: new Date() })
        .where(eq(clinic_invitations.token, token));

      // Add user to clinic
      const clinicUser = await tx.insert(clinic_users)
        .values({
          clinic_id: invitation[0].clinic_id,
          user_id: userId,
          role: invitation[0].role,
          permissions: invitation[0].permissions,
          invited_by: invitation[0].invited_by,
          invited_at: invitation[0].created_at,
          joined_at: new Date(),
          is_active: true
        })
        .returning();

      return clinicUser[0];
    });
  }

  async getClinicInvitations(clinicId: number): Promise<ClinicInvitation[]> {
    return await db
      .select()
      .from(clinic_invitations)
      .where(eq(clinic_invitations.clinic_id, clinicId))
      .orderBy(desc(clinic_invitations.created_at));
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
    if (!filters || (!filters.status && !filters.search)) {
      return db.select().from(contacts)
        .where(eq(contacts.clinic_id, clinicId))
        .orderBy(desc(contacts.last_interaction));
    }

    if (filters.status && filters.search) {
      const searchTerm = `%${filters.search}%`;
      return db.select().from(contacts)
        .where(and(
          eq(contacts.clinic_id, clinicId),
          eq(contacts.status, filters.status),
          or(
            like(contacts.name, searchTerm),
            like(contacts.phone, searchTerm)
          )
        ))
        .orderBy(desc(contacts.last_interaction));
    }

    if (filters.status) {
      return db.select().from(contacts)
        .where(and(
          eq(contacts.clinic_id, clinicId),
          eq(contacts.status, filters.status)
        ))
        .orderBy(desc(contacts.last_interaction));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      return db.select().from(contacts)
        .where(and(
          eq(contacts.clinic_id, clinicId),
          or(
            like(contacts.name, searchTerm),
            like(contacts.phone, searchTerm)
          )
        ))
        .orderBy(desc(contacts.last_interaction));
    }

    return [];
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
    if (!filters || (!filters.status && !filters.date)) {
      return db.select().from(appointments)
        .where(eq(appointments.clinic_id, clinicId))
        .orderBy(asc(appointments.scheduled_date));
    }

    if (filters.status && filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      return db.select().from(appointments)
        .where(and(
          eq(appointments.clinic_id, clinicId),
          eq(appointments.status, filters.status),
          gte(appointments.scheduled_date, startOfDay),
          lte(appointments.scheduled_date, endOfDay)
        ))
        .orderBy(asc(appointments.scheduled_date));
    }

    if (filters.status) {
      return db.select().from(appointments)
        .where(and(
          eq(appointments.clinic_id, clinicId),
          eq(appointments.status, filters.status)
        ))
        .orderBy(asc(appointments.scheduled_date));
    }

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      return db.select().from(appointments)
        .where(and(
          eq(appointments.clinic_id, clinicId),
          gte(appointments.scheduled_date, startOfDay),
          lte(appointments.scheduled_date, endOfDay)
        ))
        .orderBy(asc(appointments.scheduled_date));
    }

    return [];
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
    if (!metricType && !dateRange) {
      return db.select().from(analytics_metrics)
        .where(eq(analytics_metrics.clinic_id, clinicId))
        .orderBy(desc(analytics_metrics.date));
    }

    if (metricType && dateRange) {
      return db.select().from(analytics_metrics)
        .where(and(
          eq(analytics_metrics.clinic_id, clinicId),
          eq(analytics_metrics.metric_type, metricType),
          gte(analytics_metrics.date, dateRange.start),
          lte(analytics_metrics.date, dateRange.end)
        ))
        .orderBy(desc(analytics_metrics.date));
    }

    if (metricType) {
      return db.select().from(analytics_metrics)
        .where(and(
          eq(analytics_metrics.clinic_id, clinicId),
          eq(analytics_metrics.metric_type, metricType)
        ))
        .orderBy(desc(analytics_metrics.date));
    }

    if (dateRange) {
      return db.select().from(analytics_metrics)
        .where(and(
          eq(analytics_metrics.clinic_id, clinicId),
          gte(analytics_metrics.date, dateRange.start),
          lte(analytics_metrics.date, dateRange.end)
        ))
        .orderBy(desc(analytics_metrics.date));
    }

    return [];
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

  // ============ PIPELINE STAGES ============
  
  async getPipelineStages(clinicId: number): Promise<PipelineStage[]> {
    return db.select().from(pipeline_stages)
      .where(and(
        eq(pipeline_stages.clinic_id, clinicId),
        eq(pipeline_stages.is_active, true)
      ))
      .orderBy(asc(pipeline_stages.order_position));
  }

  async getPipelineStage(id: number): Promise<PipelineStage | undefined> {
    const result = await db.select().from(pipeline_stages).where(eq(pipeline_stages.id, id)).limit(1);
    return result[0];
  }

  async createPipelineStage(insertStage: InsertPipelineStage): Promise<PipelineStage> {
    const result = await db.insert(pipeline_stages).values(insertStage).returning();
    return result[0];
  }

  async updatePipelineStage(id: number, updates: Partial<InsertPipelineStage>): Promise<PipelineStage | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date()
    };

    const result = await db.update(pipeline_stages)
      .set(updateData)
      .where(eq(pipeline_stages.id, id))
      .returning();
    return result[0];
  }

  async deletePipelineStage(id: number): Promise<boolean> {
    const result = await db.update(pipeline_stages)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(pipeline_stages.id, id))
      .returning();
    return result.length > 0;
  }

  // ============ PIPELINE OPPORTUNITIES ============
  
  async getPipelineOpportunities(clinicId: number, filters?: { stageId?: number; status?: string; assignedTo?: string }): Promise<PipelineOpportunity[]> {
    if (!filters || (!filters.stageId && !filters.status && !filters.assignedTo)) {
      return db.select().from(pipeline_opportunities)
        .where(eq(pipeline_opportunities.clinic_id, clinicId))
        .orderBy(desc(pipeline_opportunities.created_at));
    }

    if (filters.stageId && filters.status && filters.assignedTo) {
      return db.select().from(pipeline_opportunities)
        .where(and(
          eq(pipeline_opportunities.clinic_id, clinicId),
          eq(pipeline_opportunities.stage_id, filters.stageId),
          eq(pipeline_opportunities.status, filters.status),
          eq(pipeline_opportunities.assigned_to, filters.assignedTo)
        ))
        .orderBy(desc(pipeline_opportunities.created_at));
    }

    if (filters.stageId && filters.status) {
      return db.select().from(pipeline_opportunities)
        .where(and(
          eq(pipeline_opportunities.clinic_id, clinicId),
          eq(pipeline_opportunities.stage_id, filters.stageId),
          eq(pipeline_opportunities.status, filters.status)
        ))
        .orderBy(desc(pipeline_opportunities.created_at));
    }

    if (filters.stageId) {
      return db.select().from(pipeline_opportunities)
        .where(and(
          eq(pipeline_opportunities.clinic_id, clinicId),
          eq(pipeline_opportunities.stage_id, filters.stageId)
        ))
        .orderBy(desc(pipeline_opportunities.created_at));
    }

    if (filters.status) {
      return db.select().from(pipeline_opportunities)
        .where(and(
          eq(pipeline_opportunities.clinic_id, clinicId),
          eq(pipeline_opportunities.status, filters.status)
        ))
        .orderBy(desc(pipeline_opportunities.created_at));
    }

    if (filters.assignedTo) {
      return db.select().from(pipeline_opportunities)
        .where(and(
          eq(pipeline_opportunities.clinic_id, clinicId),
          eq(pipeline_opportunities.assigned_to, filters.assignedTo)
        ))
        .orderBy(desc(pipeline_opportunities.created_at));
    }

    return [];
  }

  async getPipelineOpportunity(id: number): Promise<PipelineOpportunity | undefined> {
    const result = await db.select().from(pipeline_opportunities).where(eq(pipeline_opportunities.id, id)).limit(1);
    return result[0];
  }

  async createPipelineOpportunity(insertOpportunity: InsertPipelineOpportunity): Promise<PipelineOpportunity> {
    const result = await db.insert(pipeline_opportunities).values(insertOpportunity).returning();
    return result[0];
  }

  async updatePipelineOpportunity(id: number, updates: Partial<InsertPipelineOpportunity>): Promise<PipelineOpportunity | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date()
    };

    const result = await db.update(pipeline_opportunities)
      .set(updateData)
      .where(eq(pipeline_opportunities.id, id))
      .returning();
    return result[0];
  }

  async moveOpportunityToStage(opportunityId: number, newStageId: number, changedBy?: string, notes?: string): Promise<PipelineOpportunity | undefined> {
    // Get current opportunity
    const opportunity = await this.getPipelineOpportunity(opportunityId);
    if (!opportunity) return undefined;

    const oldStageId = opportunity.stage_id;
    const now = new Date();
    
    // Calculate duration in previous stage
    const durationInStage = opportunity.stage_entered_at 
      ? Math.floor((now.getTime() - new Date(opportunity.stage_entered_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Create history record
    if (oldStageId) {
      await this.createPipelineHistory({
        opportunity_id: opportunityId,
        from_stage_id: oldStageId,
        to_stage_id: newStageId,
        changed_by: changedBy,
        notes: notes,
        duration_in_stage: durationInStage
      });
    }

    // Update opportunity
    const result = await db.update(pipeline_opportunities)
      .set({
        stage_id: newStageId,
        stage_entered_at: now,
        updated_at: now
      })
      .where(eq(pipeline_opportunities.id, opportunityId))
      .returning();
    
    return result[0];
  }

  // ============ PIPELINE HISTORY ============
  
  async getPipelineHistory(opportunityId: number): Promise<PipelineHistory[]> {
    return db.select().from(pipeline_history)
      .where(eq(pipeline_history.opportunity_id, opportunityId))
      .orderBy(desc(pipeline_history.created_at));
  }

  async createPipelineHistory(insertHistory: InsertPipelineHistory): Promise<PipelineHistory> {
    const result = await db.insert(pipeline_history).values(insertHistory).returning();
    return result[0];
  }

  // ============ PIPELINE ACTIVITIES ============
  
  async getPipelineActivities(opportunityId: number): Promise<PipelineActivity[]> {
    return db.select().from(pipeline_activities)
      .where(eq(pipeline_activities.opportunity_id, opportunityId))
      .orderBy(desc(pipeline_activities.created_at));
  }

  async createPipelineActivity(insertActivity: InsertPipelineActivity): Promise<PipelineActivity> {
    const result = await db.insert(pipeline_activities).values(insertActivity).returning();
    return result[0];
  }

  async updatePipelineActivity(id: number, updates: Partial<InsertPipelineActivity>): Promise<PipelineActivity | undefined> {
    const updateData = {
      ...updates,
      updated_at: new Date()
    };

    const result = await db.update(pipeline_activities)
      .set(updateData)
      .where(eq(pipeline_activities.id, id))
      .returning();
    return result[0];
  }

  async completePipelineActivity(id: number, outcome?: string): Promise<PipelineActivity | undefined> {
    return this.updatePipelineActivity(id, {
      status: "completed",
      completed_date: new Date(),
      outcome: outcome
    });
  }
}

export const postgresStorage = new PostgreSQLStorage();