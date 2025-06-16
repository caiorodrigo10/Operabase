import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, unique, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Remaining schemas for features that haven't been fully modularized yet

// Tabela para etiquetas de consultas (appointment tags)
export const appointment_tags = pgTable("appointment_tags", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(), // Cor da etiqueta em hexadecimal
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_appointment_tags_clinic").on(table.clinic_id),
]);

// Tabela para métricas e analytics
export const analytics_metrics = pgTable("analytics_metrics", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  metric_type: text("metric_type").notNull(), // daily_messages, appointments_scheduled, conversion_rate, etc
  value: integer("value").notNull(),
  date: timestamp("date").notNull(),
  metadata: text("metadata"), // JSON string para dados adicionais
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela para templates de mensagens da IA
export const ai_templates = pgTable("ai_templates", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  template_name: text("template_name").notNull(),
  template_type: text("template_type").notNull(), // greeting, appointment_confirmation, follow_up, etc
  content: text("content").notNull(),
  variables: text("variables").array(), // variáveis disponíveis no template
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para estágios do pipeline
export const pipeline_stages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  name: text("name").notNull(), // "Novos Contatos", "Qualificação", "Proposta", etc
  description: text("description"),
  order_position: integer("order_position").notNull(),
  color: text("color").default("#3b82f6"), // cor para exibição visual
  is_active: boolean("is_active").default(true),
  target_days: integer("target_days"), // dias esperados neste estágio
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para oportunidades do pipeline
export const pipeline_opportunities = pgTable("pipeline_opportunities", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  contact_id: integer("contact_id").notNull(),
  stage_id: integer("stage_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  value: integer("value"), // valor estimado em centavos
  probability: integer("probability").default(50), // % de chance de conversão
  expected_close_date: timestamp("expected_close_date"),
  actual_close_date: timestamp("actual_close_date"),
  status: text("status").notNull().default("active"), // active, won, lost, postponed
  lost_reason: text("lost_reason"),
  source: text("source"), // whatsapp, site, indicacao, marketing, etc
  assigned_to: text("assigned_to"), // responsável pela oportunidade
  tags: text("tags").array(), // tags personalizáveis
  priority: text("priority").default("medium"), // low, medium, high, urgent
  next_action: text("next_action"), // próxima ação a ser realizada
  next_action_date: timestamp("next_action_date"),
  stage_entered_at: timestamp("stage_entered_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de movimentações no pipeline
export const pipeline_history = pgTable("pipeline_history", {
  id: serial("id").primaryKey(),
  opportunity_id: integer("opportunity_id").notNull(),
  from_stage_id: integer("from_stage_id"),
  to_stage_id: integer("to_stage_id").notNull(),
  changed_by: text("changed_by"),
  notes: text("notes"),
  duration_in_stage: integer("duration_in_stage"), // tempo em dias no estágio anterior
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela para atividades relacionadas às oportunidades
export const pipeline_activities = pgTable("pipeline_activities", {
  id: serial("id").primaryKey(),
  opportunity_id: integer("opportunity_id").notNull(),
  activity_type: text("activity_type").notNull(), // call, email, meeting, whatsapp, note, task
  title: text("title").notNull(),
  description: text("description"),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  outcome: text("outcome"), // resultado da atividade
  next_activity_suggested: text("next_activity_suggested"),
  created_by: text("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Schemas for remaining non-modularized features

export const insertAppointmentTagSchema = createInsertSchema(appointment_tags, {
  name: z.string().min(1, "Nome da etiqueta é obrigatório").max(50, "Nome muito longo"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal (#RRGGBB)"),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAnalyticsMetricSchema = createInsertSchema(analytics_metrics).omit({
  id: true,
  created_at: true,
});

// clinic_settings schema moved to domains/settings/settings.schema.ts

export const insertAiTemplateSchema = createInsertSchema(ai_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPipelineStageSchema = createInsertSchema(pipeline_stages).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPipelineOpportunitySchema = createInsertSchema(pipeline_opportunities).omit({
  id: true,
  stage_entered_at: true,
  created_at: true,
  updated_at: true,
});

export const insertPipelineHistorySchema = createInsertSchema(pipeline_history).omit({
  id: true,
  created_at: true,
});

export const insertPipelineActivitySchema = createInsertSchema(pipeline_activities).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

// professional_status_audit schema moved to domains/clinics/clinics.schema.ts

// Type definitions for remaining schemas
export type AppointmentTag = typeof appointment_tags.$inferSelect;
export type AnalyticsMetric = typeof analytics_metrics.$inferSelect;
export type AiTemplate = typeof ai_templates.$inferSelect;
export type PipelineStage = typeof pipeline_stages.$inferSelect;
export type PipelineOpportunity = typeof pipeline_opportunities.$inferSelect;
export type PipelineHistory = typeof pipeline_history.$inferSelect;
export type PipelineActivity = typeof pipeline_activities.$inferSelect;



// Google Calendar integrations table - aligned with Supabase structure
export const calendar_integrations = pgTable("calendar_integrations", {
  id: serial("id").primaryKey(),
  user_id: text("user_id").notNull(), // Changed to TEXT for Supabase UUIDs
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  provider: text("provider").notNull(),
  provider_user_id: text("provider_user_id"),
  email: text("email"),
  calendar_id: text("calendar_id"),
  calendar_name: text("calendar_name"),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  token_expires_at: timestamp("token_expires_at"),
  is_active: boolean("is_active").default(true),
  sync_enabled: boolean("sync_enabled").default(true),
  last_sync_at: timestamp("last_sync_at"),
  sync_errors: text("sync_errors"),
  sync_token: text("sync_token"), // For incremental sync
  watch_channel_id: text("watch_channel_id"), // Webhook channel ID
  watch_resource_id: text("watch_resource_id"), // Google resource ID
  watch_expires_at: timestamp("watch_expires_at"), // Webhook expiration
  sync_in_progress: boolean("sync_in_progress").default(false), // Lock mechanism
  last_sync_trigger: text("last_sync_trigger"), // webhook, login, manual, etc
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_calendar_user").on(table.user_id),
  index("idx_calendar_clinic").on(table.clinic_id),
  index("idx_calendar_watch").on(table.watch_channel_id),
  unique().on(table.user_id, table.email, table.provider),
]);

export const insertCalendarIntegrationSchema = createInsertSchema(calendar_integrations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CalendarIntegration = typeof calendar_integrations.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;

// Tabela para prontuários médicos vinculados às consultas
export const medical_records = pgTable("medical_records", {
  id: serial("id").primaryKey(),
  appointment_id: integer("appointment_id").references(() => appointments.id),
  contact_id: integer("contact_id").references(() => contacts.id).notNull(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  record_type: text("record_type").notNull().default("consultation"), // consultation, exam, prescription, note
  content: text("content"), // nota livre em formato markdown
  chief_complaint: text("chief_complaint"), // queixa principal
  history_present_illness: text("history_present_illness"), // história da doença atual
  physical_examination: text("physical_examination"), // exame físico
  diagnosis: text("diagnosis"), // diagnóstico
  treatment_plan: text("treatment_plan"), // plano de tratamento
  prescriptions: jsonb("prescriptions"), // receitas médicas
  exam_requests: jsonb("exam_requests"), // solicitações de exames
  follow_up_instructions: text("follow_up_instructions"), // instruções de retorno
  observations: text("observations"), // observações gerais
  vital_signs: jsonb("vital_signs"), // sinais vitais (pressão, temperatura, etc)
  attachments: text("attachments").array(), // URLs de anexos (imagens, PDFs, etc)
  voice_transcription: text("voice_transcription"), // transcrição de áudio
  ai_summary: text("ai_summary"), // resumo gerado por IA
  templates_used: text("templates_used").array(), // templates médicos utilizados
  version: integer("version").default(1), // controle de versão
  is_active: boolean("is_active").default(true),
  created_by: integer("created_by").references(() => users.id),
  updated_by: integer("updated_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_medical_records_appointment").on(table.appointment_id),
  index("idx_medical_records_contact").on(table.contact_id),
  index("idx_medical_records_clinic").on(table.clinic_id),
]);

export const insertMedicalRecordSchema = createInsertSchema(medical_records).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type MedicalRecord = typeof medical_records.$inferSelect;
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;

// Password reset token schemas
export const insertPasswordResetTokenSchema = createInsertSchema(password_reset_tokens).omit({
  id: true,
  created_at: true,
});

export type PasswordResetToken = typeof password_reset_tokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// User profile update schema
export const updateUserProfileSchema = createInsertSchema(users).omit({
  id: true,
  password: true,
  role: true,
  is_active: true,
  last_login: true,
  created_at: true,
  updated_at: true,
}).extend({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Se está tentando alterar senha, deve fornecer senha atual
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  // Se forneceu nova senha, deve confirmar
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Para alterar a senha, forneça a senha atual e confirme a nova senha",
  path: ["newPassword"],
});

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;


