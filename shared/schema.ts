import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal, date, jsonb, index, unique } from "drizzle-orm/pg-core";
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

// Enhanced users table for email/password authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull().default("admin"), // super_admin, admin, manager, user
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Clinic-User relationship table for multi-tenant access
export const clinic_users = pgTable("clinic_users", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  user_id: integer("user_id").notNull(),
  role: varchar("role").notNull().default("user"), // admin, manager, user, readonly
  permissions: jsonb("permissions"), // Specific permissions for this clinic
  is_active: boolean("is_active").notNull().default(true),
  invited_by: integer("invited_by"),
  invited_at: timestamp("invited_at"),
  joined_at: timestamp("joined_at"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.clinic_id, table.user_id),
  index("idx_clinic_users_clinic").on(table.clinic_id),
  index("idx_clinic_users_user").on(table.user_id),
]);

// Clinic invitations for onboarding new team members
export const clinic_invitations = pgTable("clinic_invitations", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  email: varchar("email").notNull(),
  role: varchar("role").notNull(),
  permissions: jsonb("permissions"),
  token: varchar("token").notNull().unique(),
  invited_by: integer("invited_by").notNull(),
  expires_at: timestamp("expires_at").notNull(),
  accepted_at: timestamp("accepted_at"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_invitations_email").on(table.email),
  index("idx_invitations_token").on(table.token),
]);

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
  contact_id: integer("contact_id").references(() => contacts.id).notNull(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  user_id: integer("user_id").references(() => users.id).notNull(), // Required: user who created/owns the appointment
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
  google_calendar_event_id: text("google_calendar_event_id"), // Link to Google Calendar event
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_appointments_user").on(table.user_id),
  index("idx_appointments_contact").on(table.contact_id),
  index("idx_appointments_clinic").on(table.clinic_id),
]);

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

// Tabela para estágios do pipeline
export const pipeline_stages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id),
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
  clinic_id: integer("clinic_id").references(() => clinics.id),
  contact_id: integer("contact_id").references(() => contacts.id),
  stage_id: integer("stage_id").references(() => pipeline_stages.id),
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
  opportunity_id: integer("opportunity_id").references(() => pipeline_opportunities.id),
  from_stage_id: integer("from_stage_id").references(() => pipeline_stages.id),
  to_stage_id: integer("to_stage_id").references(() => pipeline_stages.id),
  changed_by: text("changed_by"),
  notes: text("notes"),
  duration_in_stage: integer("duration_in_stage"), // tempo em dias no estágio anterior
  created_at: timestamp("created_at").defaultNow(),
});

// Tabela para atividades relacionadas às oportunidades
export const pipeline_activities = pgTable("pipeline_activities", {
  id: serial("id").primaryKey(),
  opportunity_id: integer("opportunity_id").references(() => pipeline_opportunities.id),
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

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertClinicUserSchema = createInsertSchema(clinic_users).omit({
  id: true,
  created_at: true,
});

export const insertClinicInvitationSchema = createInsertSchema(clinic_invitations).omit({
  id: true,
  created_at: true,
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ClinicUser = typeof clinic_users.$inferSelect;
export type InsertClinicUser = z.infer<typeof insertClinicUserSchema>;
export type ClinicInvitation = typeof clinic_invitations.$inferSelect;
export type InsertClinicInvitation = z.infer<typeof insertClinicInvitationSchema>;
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
export type PipelineStage = typeof pipeline_stages.$inferSelect;
export type InsertPipelineStage = z.infer<typeof insertPipelineStageSchema>;
export type PipelineOpportunity = typeof pipeline_opportunities.$inferSelect;
export type InsertPipelineOpportunity = z.infer<typeof insertPipelineOpportunitySchema>;
export type PipelineHistory = typeof pipeline_history.$inferSelect;
export type InsertPipelineHistory = z.infer<typeof insertPipelineHistorySchema>;
export type PipelineActivity = typeof pipeline_activities.$inferSelect;
export type InsertPipelineActivity = z.infer<typeof insertPipelineActivitySchema>;

// Financial Module - Asaas Integration
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  contact_id: integer("contact_id").references(() => contacts.id),
  asaas_customer_id: text("asaas_customer_id").unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  cpf_cnpj: text("cpf_cnpj"),
  address: text("address"),
  address_number: text("address_number"),
  complement: text("complement"),
  province: text("province"),
  city: text("city"),
  postal_code: text("postal_code"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const charges = pgTable("charges", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  customer_id: integer("customer_id").references(() => customers.id).notNull(),
  appointment_id: integer("appointment_id").references(() => appointments.id),
  asaas_charge_id: text("asaas_charge_id").unique(),
  billing_type: text("billing_type").notNull(), // BOLETO, CREDIT_CARD, PIX, UNDEFINED
  value: integer("value").notNull(), // em centavos
  net_value: integer("net_value"),
  original_value: integer("original_value"),
  interest_value: integer("interest_value"),
  description: text("description"),
  external_reference: text("external_reference"),
  status: text("status").notNull(), // PENDING, CONFIRMED, RECEIVED, OVERDUE, REFUNDED, etc
  due_date: date("due_date").notNull(),
  original_due_date: date("original_due_date"),
  payment_date: timestamp("payment_date"),
  client_payment_date: date("client_payment_date"),
  installment_number: integer("installment_number"),
  installment_count: integer("installment_count"),
  gross_value: integer("gross_value"),
  invoice_url: text("invoice_url"),
  bank_slip_url: text("bank_slip_url"),
  transaction_receipt_url: text("transaction_receipt_url"),
  invoice_number: text("invoice_number"),
  credit_card: jsonb("credit_card"),
  discount: jsonb("discount"),
  fine: jsonb("fine"),
  interest: jsonb("interest"),
  deleted: boolean("deleted").default(false),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_charges_clinic").on(table.clinic_id),
  index("idx_charges_customer").on(table.customer_id),
  index("idx_charges_status").on(table.status),
  index("idx_charges_due_date").on(table.due_date),
]);

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  customer_id: integer("customer_id").references(() => customers.id).notNull(),
  asaas_subscription_id: text("asaas_subscription_id").unique(),
  billing_type: text("billing_type").notNull(),
  value: integer("value").notNull(),
  cycle: text("cycle").notNull(), // WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY
  description: text("description"),
  status: text("status").notNull(), // ACTIVE, EXPIRED, OVERDUE, etc
  next_due_date: date("next_due_date"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_subscriptions_clinic").on(table.clinic_id),
  index("idx_subscriptions_customer").on(table.customer_id),
  index("idx_subscriptions_status").on(table.status),
]);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  charge_id: integer("charge_id").references(() => charges.id),
  asaas_payment_id: text("asaas_payment_id").unique(),
  value: integer("value").notNull(),
  net_value: integer("net_value"),
  payment_date: timestamp("payment_date").notNull(),
  billing_type: text("billing_type").notNull(),
  status: text("status").notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_payments_clinic").on(table.clinic_id),
  index("idx_payments_charge").on(table.charge_id),
  index("idx_payments_date").on(table.payment_date),
]);

export const financial_transactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  type: text("type").notNull(), // INCOME, EXPENSE
  category: text("category").notNull(), // CONSULTATION_FEE, MEDICATION, EQUIPMENT, etc
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // em centavos
  payment_method: text("payment_method"), // CASH, CARD, PIX, TRANSFER
  charge_id: integer("charge_id").references(() => charges.id),
  appointment_id: integer("appointment_id").references(() => appointments.id),
  contact_id: integer("contact_id").references(() => contacts.id),
  reference_date: date("reference_date").notNull(),
  notes: text("notes"),
  created_by: integer("created_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_transactions_clinic").on(table.clinic_id),
  index("idx_transactions_type").on(table.type),
  index("idx_transactions_category").on(table.category),
  index("idx_transactions_date").on(table.reference_date),
]);

export const financial_reports = pgTable("financial_reports", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  report_type: text("report_type").notNull(), // DAILY, WEEKLY, MONTHLY, YEARLY
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  total_income: integer("total_income").default(0),
  total_expenses: integer("total_expenses").default(0),
  net_profit: integer("net_profit").default(0),
  total_charges: integer("total_charges").default(0),
  pending_charges: integer("pending_charges").default(0),
  received_charges: integer("received_charges").default(0),
  overdue_charges: integer("overdue_charges").default(0),
  report_data: jsonb("report_data"), // dados detalhados do relatório
  generated_by: integer("generated_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_reports_clinic").on(table.clinic_id),
  index("idx_reports_type").on(table.report_type),
  index("idx_reports_date").on(table.start_date, table.end_date),
]);

// Google Calendar integrations table
export const calendar_integrations = pgTable("calendar_integrations", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id).notNull(),
  clinic_id: integer("clinic_id").references(() => clinics.id).notNull(),
  provider: text("provider").notNull(), // google, outlook, icloud
  email: text("email").notNull(),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  token_expires_at: timestamp("token_expires_at"),
  calendar_id: text("calendar_id"), // primary calendar ID
  sync_preference: text("sync_preference").default("one-way"), // one-way, two-way
  is_active: boolean("is_active").default(true),
  last_sync: timestamp("last_sync"),
  sync_errors: text("sync_errors"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_calendar_user").on(table.user_id),
  index("idx_calendar_clinic").on(table.clinic_id),
  unique().on(table.user_id, table.email, table.provider),
]);

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertChargeSchema = createInsertSchema(charges).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  created_at: true,
});

export const insertFinancialTransactionSchema = createInsertSchema(financial_transactions).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertFinancialReportSchema = createInsertSchema(financial_reports).omit({
  id: true,
  created_at: true,
});

export const insertCalendarIntegrationSchema = createInsertSchema(calendar_integrations).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Charge = typeof charges.$inferSelect;
export type InsertCharge = z.infer<typeof insertChargeSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type FinancialTransaction = typeof financial_transactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialReport = typeof financial_reports.$inferSelect;
export type InsertFinancialReport = z.infer<typeof insertFinancialReportSchema>;
export type CalendarIntegration = typeof calendar_integrations.$inferSelect;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;
