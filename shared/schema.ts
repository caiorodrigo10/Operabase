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

// Tabela para números do WhatsApp conectados
export const whatsapp_numbers = pgTable("whatsapp_numbers", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  user_id: text("user_id").notNull(), // ID do usuário que conectou o número
  phone_number: text("phone_number").notNull(),
  instance_name: text("instance_name").notNull(), // Nome único da instância na Evolution API
  status: text("status").notNull().default("disconnected"), // connected, disconnected, connecting, error
  connected_at: timestamp("connected_at"),
  last_seen: timestamp("last_seen"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_whatsapp_numbers_clinic").on(table.clinic_id),
  index("idx_whatsapp_numbers_user").on(table.user_id),
  unique("unique_phone_clinic").on(table.phone_number, table.clinic_id),
  unique("unique_instance_name").on(table.instance_name),
]);

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

// Tabela para estágios do pipeline de vendas
export const pipeline_stages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  order_index: integer("order_index").notNull(),
  color: text("color").default("#3B82F6"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para oportunidades no pipeline
export const pipeline_opportunities = pgTable("pipeline_opportunities", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  stage_id: integer("stage_id").notNull(),
  contact_id: integer("contact_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  value: integer("value"), // valor estimado em centavos
  probability: integer("probability").default(50), // probabilidade de fechamento (0-100)
  expected_close_date: timestamp("expected_close_date"),
  assigned_to: text("assigned_to"), // usuário responsável
  status: text("status").default("active"), // active, won, lost, on_hold
  tags: text("tags").array(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de mudanças de estágio
export const pipeline_history = pgTable("pipeline_history", {
  id: serial("id").primaryKey(),
  opportunity_id: integer("opportunity_id").notNull(),
  from_stage_id: integer("from_stage_id"),
  to_stage_id: integer("to_stage_id").notNull(),
  changed_by: text("changed_by").notNull(),
  change_reason: text("change_reason"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela para atividades do pipeline (follow-ups, calls, meetings)
export const pipeline_activities = pgTable("pipeline_activities", {
  id: serial("id").primaryKey(),
  opportunity_id: integer("opportunity_id").notNull(),
  activity_type: text("activity_type").notNull(), // call, meeting, email, task, note
  title: text("title").notNull(),
  description: text("description"),
  scheduled_date: timestamp("scheduled_date"),
  completed_date: timestamp("completed_date"),
  assigned_to: text("assigned_to").notNull(),
  status: text("status").default("pending"), // pending, completed, cancelled
  outcome: text("outcome"), // resultado da atividade quando completada
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para API Keys de autenticação N8N
export const api_keys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  key_name: varchar("key_name", { length: 255 }).notNull(),
  api_key: varchar("api_key", { length: 64 }).notNull(),
  key_hash: text("key_hash").notNull(), // bcrypt hash da API key
  is_active: boolean("is_active").default(true),
  permissions: jsonb("permissions").default(['read', 'write']),
  last_used_at: timestamp("last_used_at"),
  usage_count: integer("usage_count").default(0),
  expires_at: timestamp("expires_at"),
  created_by: integer("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_api_key").on(table.api_key),
  index("idx_api_keys_key").on(table.api_key),
  index("idx_api_keys_clinic").on(table.clinic_id),
  index("idx_api_keys_active").on(table.is_active),
]);

// Schema validations for forms
export const insertAppointmentTagSchema = createInsertSchema(appointment_tags).extend({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal"),
});

export const insertAnalyticsMetricSchema = createInsertSchema(analytics_metrics);

export const insertWhatsAppNumberSchema = createInsertSchema(whatsapp_numbers).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  phone_number: z.string().min(1, "Número do telefone é obrigatório"),
  instance_name: z.string().min(1, "Nome da instância é obrigatório"),
  status: z.enum(['connected', 'disconnected', 'connecting', 'error']).default('disconnected'),
});

export const insertApiKeySchema = createInsertSchema(api_keys).omit({
  id: true,
  api_key: true,
  key_hash: true,
  created_at: true,
  updated_at: true,
  last_used_at: true,
  usage_count: true,
}).extend({
  key_name: z.string().min(1, "Nome da API Key é obrigatório").max(255),
  permissions: z.array(z.enum(['read', 'write', 'admin'])).default(['read', 'write']),
});

export const insertAiTemplateSchema = createInsertSchema(ai_templates);

export const insertPipelineStageSchema = createInsertSchema(pipeline_stages);

// Anamnesis System Tables
export const anamnesis_templates = pgTable("anamnesis_templates", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  fields: jsonb("fields").notNull(), // Structure: {questions: [{id, text, type, options, required}]}
  is_default: boolean("is_default").default(false),
  is_active: boolean("is_active").default(true),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_anamnesis_templates_clinic").on(table.clinic_id),
  index("idx_anamnesis_templates_default").on(table.is_default),
]);

export const anamnesis_responses = pgTable("anamnesis_responses", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").notNull(),
  clinic_id: integer("clinic_id").notNull(),
  template_id: integer("template_id").notNull(),
  responses: jsonb("responses").notNull(), // Patient responses: {questionId: value}
  status: text("status").default("pending"), // pending, completed, expired
  share_token: text("share_token").notNull(),
  patient_name: text("patient_name"),
  patient_email: text("patient_email"),
  patient_phone: text("patient_phone"),
  completed_at: timestamp("completed_at"),
  expires_at: timestamp("expires_at"),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique("unique_share_token").on(table.share_token),
  index("idx_anamnesis_responses_contact").on(table.contact_id),
  index("idx_anamnesis_responses_clinic").on(table.clinic_id),
  index("idx_anamnesis_responses_token").on(table.share_token),
  index("idx_anamnesis_responses_status").on(table.status),
]);

// Anamnesis validation schemas
export const insertAnamnesisTemplateSchema = createInsertSchema(anamnesis_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  name: z.string().min(1, "Nome do template é obrigatório"),
  fields: z.object({
    questions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(['text', 'radio', 'checkbox', 'textarea']),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(false),
      additionalInfo: z.boolean().default(false),
    })),
  }),
});

export const insertAnamnesisResponseSchema = createInsertSchema(anamnesis_responses).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  responses: z.record(z.any()),
  patient_name: z.string().min(1, "Nome do paciente é obrigatório"),
  patient_email: z.string().email("Email inválido").optional(),
  patient_phone: z.string().optional(),
});

export type SelectAnamnesisTemplate = typeof anamnesis_templates.$inferSelect;
export type InsertAnamnesisTemplate = z.infer<typeof insertAnamnesisTemplateSchema>;
export type SelectAnamnesisResponse = typeof anamnesis_responses.$inferSelect;
export type InsertAnamnesisResponse = z.infer<typeof insertAnamnesisResponseSchema>;

export const insertPipelineOpportunitySchema = createInsertSchema(pipeline_opportunities);

export const insertPipelineHistorySchema = createInsertSchema(pipeline_history);

export const insertPipelineActivitySchema = createInsertSchema(pipeline_activities);

// Type definitions
export type WhatsAppNumber = typeof whatsapp_numbers.$inferSelect;
export type InsertWhatsAppNumber = z.infer<typeof insertWhatsAppNumberSchema>;

export type AppointmentTag = typeof appointment_tags.$inferSelect;
export type InsertAppointmentTag = z.infer<typeof insertAppointmentTagSchema>;

export type AnalyticsMetric = typeof analytics_metrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;

export type AiTemplate = typeof ai_templates.$inferSelect;
export type InsertAiTemplate = z.infer<typeof insertAiTemplateSchema>;

export type PipelineStage = typeof pipeline_stages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;

export type PipelineOpportunity = typeof pipeline_opportunities.$inferSelect;
export type InsertPipelineOpportunity = z.infer<typeof insertPipelineOpportunitySchema>;

export type PipelineHistory = typeof pipeline_history.$inferSelect;
export type InsertPipelineHistory = z.infer<typeof insertPipelineHistorySchema>;

export type PipelineActivity = typeof pipeline_activities.$inferSelect;
export type InsertPipelineActivity = z.infer<typeof insertPipelineActivitySchema>;