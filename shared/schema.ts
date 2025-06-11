import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  responsible: text("responsible").notNull(),
  whatsapp_number: text("whatsapp_number").notNull(),
  specialties: text("specialties").array(),
  working_hours: text("working_hours"),
  created_at: timestamp("created_at").defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  age: integer("age"),
  gender: text("gender"),
  profession: text("profession"),
  address: text("address"),
  emergency_contact: text("emergency_contact"),
  medical_history: text("medical_history"),
  current_medications: text("current_medications").array(),
  allergies: text("allergies").array(),
  status: text("status").notNull(), // novo, em_conversa, agendado, realizado, pos_atendimento
  priority: text("priority").default("normal"), // baixa, normal, alta, urgente
  source: text("source").default("whatsapp"), // whatsapp, site, indicacao, outros
  notes: text("notes"),
  first_contact: timestamp("first_contact").defaultNow(),
  last_interaction: timestamp("last_interaction").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").references(() => contacts.id),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  status: text("status").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: integer("conversation_id").references(() => conversations.id),
  sender_type: text("sender_type").notNull(), // patient, ai
  content: text("content").notNull(),
  ai_action: text("ai_action"), // agendou_consulta, enviou_followup, etc
  timestamp: timestamp("timestamp").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  contact_id: integer("contact_id").references(() => contacts.id),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  doctor_name: text("doctor_name"),
  specialty: text("specialty"),
  appointment_type: text("appointment_type"), // primeira_consulta, retorno, avaliacao, emergencia
  scheduled_date: timestamp("scheduled_date"),
  duration_minutes: integer("duration_minutes").default(60),
  status: text("status").notNull(), // agendado, confirmado, realizado, cancelado, reagendado
  cancellation_reason: text("cancellation_reason"),
  session_notes: text("session_notes"),
  next_appointment_suggested: timestamp("next_appointment_suggested"),
  payment_status: text("payment_status").default("pendente"), // pendente, pago, isento
  payment_amount: integer("payment_amount"), // valor em centavos
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para métricas e analytics
export const analytics_metrics = pgTable("analytics_metrics", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  metric_type: text("metric_type").notNull(), // daily_messages, appointments_scheduled, conversion_rate, etc
  value: integer("value").notNull(),
  date: timestamp("date").notNull(),
  metadata: text("metadata"), // JSON string para dados adicionais
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela para configurações da clínica
export const clinic_settings = pgTable("clinic_settings", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  setting_key: text("setting_key").notNull(),
  setting_value: text("setting_value").notNull(),
  setting_type: text("setting_type").notNull(), // string, number, boolean, json
  description: text("description"),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Tabela para templates de mensagens da IA
export const ai_templates = pgTable("ai_templates", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id),
  template_name: text("template_name").notNull(),
  template_type: text("template_type").notNull(), // greeting, appointment_confirmation, follow_up, etc
  content: text("content").notNull(),
  variables: text("variables").array(), // variáveis disponíveis no template
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertClinicSchema = createInsertSchema(clinics).omit({
  id: true,
  created_at: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  first_contact: true,
  last_interaction: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAnalyticsMetricSchema = createInsertSchema(analytics_metrics).omit({
  id: true,
  created_at: true,
});

export const insertClinicSettingSchema = createInsertSchema(clinic_settings).omit({
  id: true,
  updated_at: true,
});

export const insertAiTemplateSchema = createInsertSchema(ai_templates).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Clinic = typeof clinics.$inferSelect;
export type InsertClinic = z.infer<typeof insertClinicSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type AnalyticsMetric = typeof analytics_metrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;
export type ClinicSetting = typeof clinic_settings.$inferSelect;
export type InsertClinicSetting = z.infer<typeof insertClinicSettingSchema>;
export type AiTemplate = typeof ai_templates.$inferSelect;
export type InsertAiTemplate = z.infer<typeof insertAiTemplateSchema>;
