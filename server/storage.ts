import { 
  users, clinics, contacts, appointments, analytics_metrics, clinic_settings, ai_templates,
  pipeline_stages, pipeline_opportunities, pipeline_history, pipeline_activities,
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
  type PipelineActivity, type InsertPipelineActivity
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clinics
  getClinic(id: number): Promise<Clinic | undefined>;
  createClinic(clinic: InsertClinic): Promise<Clinic>;
  updateClinic(id: number, clinic: Partial<InsertClinic>): Promise<Clinic | undefined>;

  // Contacts
  getContacts(clinicId: number, filters?: { status?: string; search?: string }): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  updateContactStatus(id: number, status: string): Promise<Contact | undefined>;

  // Appointments
  getAppointments(clinicId: number, filters?: { status?: string; date?: Date }): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  getAppointmentsByContact(contactId: number): Promise<Appointment[]>;

  // Analytics
  createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  getAnalyticsMetrics(clinicId: number, metricType?: string, dateRange?: { start: Date; end: Date }): Promise<AnalyticsMetric[]>;

  // Settings
  getClinicSettings(clinicId: number): Promise<ClinicSetting[]>;
  getClinicSetting(clinicId: number, key: string): Promise<ClinicSetting | undefined>;
  setClinicSetting(setting: InsertClinicSetting): Promise<ClinicSetting>;

  // AI Templates
  getAiTemplates(clinicId: number, templateType?: string): Promise<AiTemplate[]>;
  getAiTemplate(id: number): Promise<AiTemplate | undefined>;
  createAiTemplate(template: InsertAiTemplate): Promise<AiTemplate>;
  updateAiTemplate(id: number, template: Partial<InsertAiTemplate>): Promise<AiTemplate | undefined>;

  // Pipeline Stages
  getPipelineStages(clinicId: number): Promise<PipelineStage[]>;
  getPipelineStage(id: number): Promise<PipelineStage | undefined>;
  createPipelineStage(stage: InsertPipelineStage): Promise<PipelineStage>;
  updatePipelineStage(id: number, stage: Partial<InsertPipelineStage>): Promise<PipelineStage | undefined>;
  deletePipelineStage(id: number): Promise<boolean>;

  // Pipeline Opportunities
  getPipelineOpportunities(clinicId: number, filters?: { stageId?: number; status?: string; assignedTo?: string }): Promise<PipelineOpportunity[]>;
  getPipelineOpportunity(id: number): Promise<PipelineOpportunity | undefined>;
  createPipelineOpportunity(opportunity: InsertPipelineOpportunity): Promise<PipelineOpportunity>;
  updatePipelineOpportunity(id: number, opportunity: Partial<InsertPipelineOpportunity>): Promise<PipelineOpportunity | undefined>;
  moveOpportunityToStage(opportunityId: number, newStageId: number, changedBy?: string, notes?: string): Promise<PipelineOpportunity | undefined>;

  // Pipeline History
  getPipelineHistory(opportunityId: number): Promise<PipelineHistory[]>;
  createPipelineHistory(history: InsertPipelineHistory): Promise<PipelineHistory>;

  // Pipeline Activities
  getPipelineActivities(opportunityId: number): Promise<PipelineActivity[]>;
  createPipelineActivity(activity: InsertPipelineActivity): Promise<PipelineActivity>;
  updatePipelineActivity(id: number, activity: Partial<InsertPipelineActivity>): Promise<PipelineActivity | undefined>;
  completePipelineActivity(id: number, outcome?: string): Promise<PipelineActivity | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clinics: Map<number, Clinic>;
  private contacts: Map<number, Contact>;
  private appointments: Map<number, Appointment>;
  private analyticsMetrics: Map<number, AnalyticsMetric>;
  private clinicSettings: Map<string, ClinicSetting>; // key: `${clinicId}-${settingKey}`
  private aiTemplates: Map<number, AiTemplate>;
  private pipelineStages: Map<number, PipelineStage>;
  private pipelineOpportunities: Map<number, PipelineOpportunity>;
  private pipelineHistory: Map<number, PipelineHistory>;
  private pipelineActivities: Map<number, PipelineActivity>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.clinics = new Map();
    this.contacts = new Map();
    this.appointments = new Map();
    this.analyticsMetrics = new Map();
    this.clinicSettings = new Map();
    this.aiTemplates = new Map();
    this.pipelineStages = new Map();
    this.pipelineOpportunities = new Map();
    this.pipelineHistory = new Map();
    this.pipelineActivities = new Map();
    this.currentId = 1;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Clinics
  async getClinic(id: number): Promise<Clinic | undefined> {
    return this.clinics.get(id);
  }

  async createClinic(insertClinic: InsertClinic): Promise<Clinic> {
    const id = this.currentId++;
    const clinic: Clinic = { 
      id,
      name: insertClinic.name,
      responsible: insertClinic.responsible,
      whatsapp_number: insertClinic.whatsapp_number,
      specialties: insertClinic.specialties ?? null,
      working_hours: insertClinic.working_hours || null,
      created_at: new Date()
    };
    this.clinics.set(id, clinic);
    return clinic;
  }

  async updateClinic(id: number, updates: Partial<InsertClinic>): Promise<Clinic | undefined> {
    const clinic = this.clinics.get(id);
    if (!clinic) return undefined;
    
    const updatedClinic = { ...clinic, ...updates };
    this.clinics.set(id, updatedClinic);
    return updatedClinic;
  }

  // Contacts
  async getContacts(clinicId: number, filters?: { status?: string; search?: string }): Promise<Contact[]> {
    const allContacts = Array.from(this.contacts.values())
      .filter(contact => contact.clinic_id === clinicId);

    let filteredContacts = allContacts;

    if (filters?.status) {
      filteredContacts = filteredContacts.filter(contact => contact.status === filters.status);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchLower) ||
        contact.phone.includes(filters.search!)
      );
    }

    return filteredContacts.sort((a, b) => 
      new Date(b.last_interaction!).getTime() - new Date(a.last_interaction!).getTime()
    );
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = this.currentId++;
    const now = new Date();
    const contact: Contact = { 
      id,
      clinic_id: insertContact.clinic_id ?? null,
      name: insertContact.name,
      phone: insertContact.phone,
      email: insertContact.email || null,
      age: insertContact.age || null,
      gender: insertContact.gender || null,
      profession: insertContact.profession || null,
      address: insertContact.address || null,
      emergency_contact: insertContact.emergency_contact || null,
      medical_history: insertContact.medical_history || null,
      current_medications: insertContact.current_medications || null,
      allergies: insertContact.allergies || null,
      status: insertContact.status,
      priority: insertContact.priority || null,
      source: insertContact.source || null,
      notes: insertContact.notes || null,
      first_contact: now,
      last_interaction: now
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { 
      ...contact, 
      ...updates,
      last_interaction: new Date()
    };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async updateContactStatus(id: number, status: string): Promise<Contact | undefined> {
    return this.updateContact(id, { status });
  }

  // Appointments
  async getAppointments(clinicId: number, filters?: { status?: string; date?: Date }): Promise<Appointment[]> {
    const allAppointments = Array.from(this.appointments.values())
      .filter(appointment => appointment.clinic_id === clinicId);

    let filteredAppointments = allAppointments;

    if (filters?.status) {
      filteredAppointments = filteredAppointments.filter(appointment => appointment.status === filters.status);
    }

    if (filters?.date) {
      const targetDate = filters.date;
      filteredAppointments = filteredAppointments.filter(appointment => {
        if (!appointment.scheduled_date) return false;
        const appointmentDate = new Date(appointment.scheduled_date);
        return appointmentDate.toDateString() === targetDate.toDateString();
      });
    }

    return filteredAppointments.sort((a, b) => {
      if (!a.scheduled_date || !b.scheduled_date) return 0;
      return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
    });
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentId++;
    const now = new Date();
    const appointment: Appointment = { 
      id,
      contact_id: insertAppointment.contact_id ?? null,
      clinic_id: insertAppointment.clinic_id ?? null,
      doctor_name: insertAppointment.doctor_name || null,
      specialty: insertAppointment.specialty || null,
      appointment_type: insertAppointment.appointment_type || null,
      scheduled_date: insertAppointment.scheduled_date || null,
      duration_minutes: insertAppointment.duration_minutes || null,
      status: insertAppointment.status,
      cancellation_reason: insertAppointment.cancellation_reason || null,
      session_notes: insertAppointment.session_notes || null,
      next_appointment_suggested: insertAppointment.next_appointment_suggested || null,
      payment_status: insertAppointment.payment_status || null,
      payment_amount: insertAppointment.payment_amount || null,
      created_at: now,
      updated_at: now
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { 
      ...appointment, 
      ...updates,
      updated_at: new Date()
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async getAppointmentsByContact(contactId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values())
      .filter(appointment => appointment.contact_id === contactId)
      .sort((a, b) => {
        if (!a.scheduled_date || !b.scheduled_date) return 0;
        return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime();
      });
  }

  // Analytics
  async createAnalyticsMetric(insertMetric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const id = this.currentId++;
    const metric: AnalyticsMetric = { 
      id,
      clinic_id: insertMetric.clinic_id ?? null,
      metric_type: insertMetric.metric_type,
      value: insertMetric.value,
      date: insertMetric.date,
      metadata: insertMetric.metadata || null,
      created_at: new Date()
    };
    this.analyticsMetrics.set(id, metric);
    return metric;
  }

  async getAnalyticsMetrics(
    clinicId: number, 
    metricType?: string, 
    dateRange?: { start: Date; end: Date }
  ): Promise<AnalyticsMetric[]> {
    let metrics = Array.from(this.analyticsMetrics.values())
      .filter(metric => metric.clinic_id === clinicId);

    if (metricType) {
      metrics = metrics.filter(metric => metric.metric_type === metricType);
    }

    if (dateRange) {
      metrics = metrics.filter(metric => {
        const metricDate = new Date(metric.date);
        return metricDate >= dateRange.start && metricDate <= dateRange.end;
      });
    }

    return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Settings
  async getClinicSettings(clinicId: number): Promise<ClinicSetting[]> {
    return Array.from(this.clinicSettings.values())
      .filter(setting => setting.clinic_id === clinicId);
  }

  async getClinicSetting(clinicId: number, key: string): Promise<ClinicSetting | undefined> {
    return this.clinicSettings.get(`${clinicId}-${key}`);
  }

  async setClinicSetting(insertSetting: InsertClinicSetting): Promise<ClinicSetting> {
    const id = this.currentId++;
    const key = `${insertSetting.clinic_id}-${insertSetting.setting_key}`;
    
    const setting: ClinicSetting = { 
      id,
      clinic_id: insertSetting.clinic_id ?? null,
      setting_key: insertSetting.setting_key,
      setting_value: insertSetting.setting_value,
      setting_type: insertSetting.setting_type,
      description: insertSetting.description || null,
      updated_at: new Date()
    };
    
    this.clinicSettings.set(key, setting);
    return setting;
  }

  // AI Templates
  async getAiTemplates(clinicId: number, templateType?: string): Promise<AiTemplate[]> {
    let templates = Array.from(this.aiTemplates.values())
      .filter(template => template.clinic_id === clinicId && template.is_active);

    if (templateType) {
      templates = templates.filter(template => template.template_type === templateType);
    }

    return templates.sort((a, b) => a.template_name.localeCompare(b.template_name));
  }

  async getAiTemplate(id: number): Promise<AiTemplate | undefined> {
    return this.aiTemplates.get(id);
  }

  async createAiTemplate(insertTemplate: InsertAiTemplate): Promise<AiTemplate> {
    const id = this.currentId++;
    const now = new Date();
    const template: AiTemplate = { 
      id,
      clinic_id: insertTemplate.clinic_id ?? null,
      template_name: insertTemplate.template_name,
      template_type: insertTemplate.template_type,
      content: insertTemplate.content,
      variables: insertTemplate.variables || null,
      is_active: insertTemplate.is_active || null,
      created_at: now,
      updated_at: now
    };
    this.aiTemplates.set(id, template);
    return template;
  }

  async updateAiTemplate(id: number, updates: Partial<InsertAiTemplate>): Promise<AiTemplate | undefined> {
    const template = this.aiTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { 
      ...template, 
      ...updates,
      updated_at: new Date()
    };
    this.aiTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }
}

import { postgresStorage } from "./postgres-storage";
import { testConnection } from "./db";

// Use PostgreSQL in production, MemStorage for development
let storage: IStorage;

async function initializeStorage() {
  const hasDatabase = await testConnection();
  
  if (hasDatabase) {
    console.log("🔗 Using PostgreSQL storage");
    storage = postgresStorage;
    // Initialize data for PostgreSQL if needed
    await initializePostgreSQLData();
  } else {
    console.log("💾 Using in-memory storage for development");
    storage = new MemStorage();
    // Initialize sample data only for in-memory storage
    initializeSampleData().catch(console.error);
    initializeAnalyticsData().catch(console.error);
  }
}

// Initialize PostgreSQL with sample data if tables are empty
async function initializePostgreSQLData() {
  try {
    // Check if we already have data
    const existingClinics = await postgresStorage.getClinic(1);
    if (existingClinics) {
      console.log("✅ PostgreSQL already has data");
      return;
    }

    console.log("📝 Initializing PostgreSQL with sample data...");
    
    // Create sample clinic
    const clinic = await postgresStorage.createClinic({
      name: "Centro de Psicologia Dr. Amanda Costa",
      responsible: "Dra. Amanda Costa",
      whatsapp_number: "(11) 99876-5432",
      specialties: ["Psicologia Clínica", "TDAH em Adultos", "TDAH Infantil", "Terapia Cognitivo-Comportamental"],
      working_hours: "Seg-Sex: 9h-19h | Sáb: 9h-13h"
    });

    // Create sample contacts
    const contacts = await Promise.all([
      postgresStorage.createContact({
        clinic_id: clinic.id,
        name: "Lucas Ferreira",
        phone: "(11) 99123-4567",
        status: "agendado",
        age: 28,
        profession: "Analista de Sistemas"
      }),
      postgresStorage.createContact({
        clinic_id: clinic.id,
        name: "Carla Mendes",
        phone: "(11) 98765-4321",
        status: "em_conversa",
        age: 35,
        profession: "Professora"
      }),
      postgresStorage.createContact({
        clinic_id: clinic.id,
        name: "Pedro Oliveira",
        phone: "(11) 97654-3210",
        status: "pos_atendimento",
        age: 42,
        profession: "Engenheiro"
      }),
      postgresStorage.createContact({
        clinic_id: clinic.id,
        name: "Sofia Almeida",
        phone: "(11) 96543-2109",
        status: "novo",
        age: 22,
        profession: "Estudante"
      })
    ]);

    // Create sample appointment
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0);

    await postgresStorage.createAppointment({
      contact_id: contacts[0].id,
      clinic_id: clinic.id,
      doctor_name: "Dra. Amanda Costa",
      specialty: "Psicologia Clínica",
      appointment_type: "primeira_consulta",
      scheduled_date: tomorrow,
      status: "agendado",
      duration_minutes: 60,
      payment_status: "pendente",
      payment_amount: 15000
    });

    // Create initial settings
    await Promise.all([
      postgresStorage.setClinicSetting({
        clinic_id: clinic.id,
        setting_key: "ai_enabled",
        setting_value: "true",
        setting_type: "boolean",
        description: "Habilitar assistente de IA"
      }),
      postgresStorage.setClinicSetting({
        clinic_id: clinic.id,
        setting_key: "session_duration",
        setting_value: "60",
        setting_type: "number",
        description: "Duração padrão da sessão em minutos"
      })
    ]);

    // Create AI templates
    await Promise.all([
      postgresStorage.createAiTemplate({
        clinic_id: clinic.id,
        template_name: "Boas-vindas",
        template_type: "greeting",
        content: "Olá {{nome}}! Sou a assistente virtual da {{clinica}}. Como posso ajudá-lo hoje?",
        variables: ["nome", "clinica"],
        is_active: true
      }),
      postgresStorage.createAiTemplate({
        clinic_id: clinic.id,
        template_name: "Confirmação de Agendamento",
        template_type: "appointment_confirmation",
        content: "Perfeito, {{nome}}! Agendei sua consulta com {{doutor}} para {{data}} às {{hora}}. Você receberá uma confirmação em breve.",
        variables: ["nome", "doutor", "data", "hora"],
        is_active: true
      })
    ]);

    // Create sample analytics metrics
    const today = new Date();
    const metrics = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      metrics.push(
        postgresStorage.createAnalyticsMetric({
          clinic_id: clinic.id,
          metric_type: "daily_messages",
          value: Math.floor(Math.random() * 100) + 50,
          date: date,
          metadata: JSON.stringify({ source: "whatsapp" })
        }),
        postgresStorage.createAnalyticsMetric({
          clinic_id: clinic.id,
          metric_type: "daily_appointments",
          value: Math.floor(Math.random() * 15) + 5,
          date: date
        }),
        postgresStorage.createAnalyticsMetric({
          clinic_id: clinic.id,
          metric_type: "conversion_rate",
          value: Math.floor(Math.random() * 30) + 60,
          date: date
        })
      );
    }

    await Promise.all(metrics);
    console.log("✅ PostgreSQL sample data initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing PostgreSQL data:", error);
  }
}

// Initialize storage
initializeStorage();

export { storage };

// Initialize with sample data for in-memory storage only
async function initializeSampleData() {
  try {
    // Create sample clinic
    const clinic = await storage.createClinic({
      name: "Centro de Psicologia Dr. Amanda Costa",
      responsible: "Dra. Amanda Costa",
      whatsapp_number: "(11) 99876-5432",
      specialties: ["Psicologia Clínica", "TDAH em Adultos", "TDAH Infantil", "Terapia Cognitivo-Comportamental"],
      working_hours: "Seg-Sex: 9h-19h | Sáb: 9h-13h"
    });

    // Create sample contacts
    await storage.createContact({
      clinic_id: clinic.id,
      name: "Lucas Ferreira",
      phone: "(11) 99123-4567",
      status: "agendado",
      age: 28,
      profession: "Analista de Sistemas"
    });

    await storage.createContact({
      clinic_id: clinic.id,
      name: "Carla Mendes",
      phone: "(11) 98765-4321",
      status: "em_conversa",
      age: 35,
      profession: "Professora"
    });

    await storage.createContact({
      clinic_id: clinic.id,
      name: "Pedro Oliveira",
      phone: "(11) 97654-3210",
      status: "pos_atendimento",
      age: 42,
      profession: "Engenheiro"
    });

    await storage.createContact({
      clinic_id: clinic.id,
      name: "Sofia Almeida",
      phone: "(11) 96543-2109",
      status: "novo",
      age: 22,
      profession: "Estudante"
    });

    console.log("In-memory storage initialized successfully");
  } catch (error) {
    console.error("Error initializing in-memory storage:", error);
  }
}

// Initialize additional sample data for analytics (in-memory only)
async function initializeAnalyticsData() {
  try {
    const today = new Date();
    const clinicId = 1;

    // Create sample analytics metrics for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Daily messages metrics
      await storage.createAnalyticsMetric({
        clinic_id: clinicId,
        metric_type: "daily_messages",
        value: Math.floor(Math.random() * 100) + 50,
        date: date,
        metadata: JSON.stringify({ source: "whatsapp" })
      });

      // Daily appointments metrics
      await storage.createAnalyticsMetric({
        clinic_id: clinicId,
        metric_type: "daily_appointments",
        value: Math.floor(Math.random() * 15) + 5,
        date: date
      });

      // Conversion rate metrics
      await storage.createAnalyticsMetric({
        clinic_id: clinicId,
        metric_type: "conversion_rate",
        value: Math.floor(Math.random() * 30) + 60, // 60-90%
        date: date
      });
    }

    console.log("In-memory analytics data initialized successfully");
  } catch (error) {
    console.error("Error initializing in-memory analytics:", error);
  }
}
