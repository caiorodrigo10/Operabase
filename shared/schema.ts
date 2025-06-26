import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, unique, uuid, vector, bigint } from "drizzle-orm/pg-core";
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
  user_id: integer("user_id").notNull(), // ID do usuário responsável pelo número
  phone_number: text("phone_number").notNull(),
  instance_name: text("instance_name").notNull(), // Nome única da instância na Evolution API
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

// Tabela para configurações de Mara AI por profissional
export const mara_professional_configs = pgTable("mara_professional_configs", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  professional_id: integer("professional_id").notNull(),
  knowledge_base_id: integer("knowledge_base_id"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_mara_configs_clinic_professional").on(table.clinic_id, table.professional_id),
  index("idx_mara_configs_knowledge_base").on(table.knowledge_base_id),
  unique("unique_clinic_professional").on(table.clinic_id, table.professional_id),
]);

export const insertMaraProfessionalConfigSchema = createInsertSchema(mara_professional_configs);

export type MaraProfessionalConfig = typeof mara_professional_configs.$inferSelect;
export type InsertMaraProfessionalConfig = z.infer<typeof insertMaraProfessionalConfigSchema>;

// ================================================================
// RAG SYSTEM TABLES (ISOLATED MODULE)
// ================================================================

// Bases de conhecimento RAG (separadas dos documentos)
export const rag_knowledge_bases = pgTable("rag_knowledge_bases", {
  id: serial("id").primaryKey(),
  external_user_id: text("external_user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  created_by: text("created_by"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rag_knowledge_bases_user").on(table.external_user_id),
  unique("unique_knowledge_base_name_user").on(table.name, table.external_user_id),
]);

// Documentos RAG (isolado do sistema principal)
export const rag_documents = pgTable("rag_documents", {
  id: serial("id").primaryKey(),
  external_user_id: text("external_user_id").notNull(), // ID do usuário (não FK)
  title: text("title").notNull(),
  content_type: varchar("content_type", { length: 10 }).notNull(), // 'pdf', 'url', 'text'
  source_url: text("source_url"), // Para URLs
  file_path: text("file_path"), // Para PDFs
  original_content: text("original_content"), // Para texto direto
  extracted_content: text("extracted_content"), // Texto processado
  metadata: jsonb("metadata").default({}),
  processing_status: varchar("processing_status", { length: 20 }).default("pending"),
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_rag_documents_user").on(table.external_user_id),
  index("idx_rag_documents_status").on(table.processing_status),
]);

// Chunks de texto para embeddings
export const rag_chunks = pgTable("rag_chunks", {
  id: serial("id").primaryKey(),
  document_id: integer("document_id").notNull().references(() => rag_documents.id, { onDelete: "cascade" }),
  chunk_index: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  token_count: integer("token_count"),
  metadata: jsonb("metadata").default({}),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rag_chunks_document").on(table.document_id),
]);

// Embeddings vetoriais
export const rag_embeddings = pgTable("rag_embeddings", {
  id: serial("id").primaryKey(),
  chunk_id: integer("chunk_id").notNull().references(() => rag_chunks.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI text-embedding-3-small
  model_used: varchar("model_used", { length: 50 }).default("text-embedding-3-small"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rag_embeddings_chunk").on(table.chunk_id),
]);

// Consultas RAG para analytics
export const rag_queries = pgTable("rag_queries", {
  id: serial("id").primaryKey(),
  external_user_id: text("external_user_id").notNull(),
  query_text: text("query_text").notNull(),
  results_count: integer("results_count"),
  response_time_ms: integer("response_time_ms"),
  created_at: timestamp("created_at").defaultNow(),
});

// Zod schemas for RAG tables
export const insertRagKnowledgeBaseSchema = createInsertSchema(rag_knowledge_bases);
export const insertRagDocumentSchema = createInsertSchema(rag_documents);
export const insertRagChunkSchema = createInsertSchema(rag_chunks);
export const insertRagEmbeddingSchema = createInsertSchema(rag_embeddings);
export const insertRagQuerySchema = createInsertSchema(rag_queries);

// Types for RAG tables
export type RagKnowledgeBase = typeof rag_knowledge_bases.$inferSelect;
export type InsertRagKnowledgeBase = z.infer<typeof insertRagKnowledgeBaseSchema>;

export type RagDocument = typeof rag_documents.$inferSelect;
export type InsertRagDocument = z.infer<typeof insertRagDocumentSchema>;

export type RagChunk = typeof rag_chunks.$inferSelect;
export type InsertRagChunk = z.infer<typeof insertRagChunkSchema>;

export type RagEmbedding = typeof rag_embeddings.$inferSelect;
export type InsertRagEmbedding = z.infer<typeof insertRagEmbeddingSchema>;

export type RagQuery = typeof rag_queries.$inferSelect;
export type InsertRagQuery = z.infer<typeof insertRagQuerySchema>;

// ================================================================
// SYSTEM LOGS - CENTRALIZED AUDIT TRAIL (PHASE 1)
// ================================================================

// Tabela principal para logs do sistema
export const system_logs = pgTable("system_logs", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  
  // Identificação da ação
  entity_type: varchar("entity_type", { length: 50 }).notNull(), // 'contact', 'appointment', 'message', 'conversation', 'medical_record'
  entity_id: integer("entity_id"),
  action_type: varchar("action_type", { length: 100 }).notNull(), // 'created', 'updated', 'deleted', 'status_changed', 'sent', 'received'
  
  // Quem fez a ação
  actor_id: uuid("actor_id"), // ID do usuário que fez a ação
  actor_type: varchar("actor_type", { length: 50 }), // 'professional', 'patient', 'system', 'ai'
  actor_name: varchar("actor_name", { length: 255 }), // Nome para facilitar consultas
  
  // Contexto adicional para sistema médico
  professional_id: integer("professional_id"), // Para isolamento por profissional
  related_entity_id: integer("related_entity_id"), // Para relacionamentos (ex: appointment_id em medical_record)
  
  // Dados da ação
  previous_data: jsonb("previous_data"), // Estado anterior
  new_data: jsonb("new_data"), // Estado novo
  changes: jsonb("changes"), // Diff específico das mudanças
  
  // Contexto adicional
  source: varchar("source", { length: 50 }), // 'web', 'whatsapp', 'api', 'mobile'
  ip_address: varchar("ip_address", { length: 45 }), // IPv4/IPv6
  user_agent: text("user_agent"),
  session_id: varchar("session_id", { length: 255 }),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  // Índices para performance otimizada
  index("idx_logs_clinic_entity").on(table.clinic_id, table.entity_type, table.entity_id),
  index("idx_logs_actor").on(table.clinic_id, table.actor_id, table.created_at),
  index("idx_logs_timeline").on(table.clinic_id, table.created_at),
  index("idx_logs_professional").on(table.clinic_id, table.professional_id, table.created_at),
  index("idx_logs_entity_type").on(table.entity_type, table.action_type),
]);

// Zod schemas para validação
export const insertSystemLogSchema = createInsertSchema(system_logs).omit({
  id: true,
  created_at: true,
}).extend({
  entity_type: z.enum(['contact', 'appointment', 'message', 'conversation', 'medical_record', 'anamnesis', 'whatsapp_number']),
  action_type: z.enum([
    'created', 'updated', 'deleted', 'status_changed', 
    'sent', 'received', 'ai_response', 'filled', 'reviewed',
    'rescheduled', 'no_show', 'completed', 'cancelled',
    'connected', 'disconnected', 'archived'
  ]),
  actor_type: z.enum(['professional', 'patient', 'system', 'ai']).optional(),
  clinic_id: z.number().min(1, "Clinic ID é obrigatório"),
});

// Types para TypeScript
export type SystemLog = typeof system_logs.$inferSelect;
export type InsertSystemLog = z.infer<typeof insertSystemLogSchema>;

// ================================================================
// CONVERSATIONS SYSTEM - NEW SUPABASE INTEGRATION
// ================================================================

// Tabela principal de conversas
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  contact_id: integer("contact_id").notNull(),
  professional_id: integer("professional_id"), // Profissional responsável
  whatsapp_number_id: integer("whatsapp_number_id"), // Número do WhatsApp usado
  
  // Status e metadata
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, archived, closed
  title: varchar("title", { length: 255 }), // Título customizado da conversa
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  
  // Contadores para performance
  total_messages: integer("total_messages").default(0),
  unread_count: integer("unread_count").default(0),
  
  // Timestamps importantes
  last_message_at: timestamp("last_message_at"),
  last_activity_at: timestamp("last_activity_at").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_conversations_clinic").on(table.clinic_id),
  index("idx_conversations_contact").on(table.contact_id),
  index("idx_conversations_professional").on(table.professional_id),
  index("idx_conversations_activity").on(table.clinic_id, table.last_activity_at),
  index("idx_conversations_status").on(table.clinic_id, table.status),
]);

// Tabela de mensagens
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversation_id: bigint("conversation_id", { mode: "bigint" }).references(() => conversations.conversation_id),
  
  // Origem da mensagem
  sender_type: varchar("sender_type", { length: 50 }).notNull(), // professional, patient, system, ai
  sender_id: varchar("sender_id", { length: 255 }), // ID do remetente (user_id, contact phone, etc)
  sender_name: varchar("sender_name", { length: 255 }),
  
  // Conteúdo da mensagem
  content: text("content"),
  message_type: varchar("message_type", { length: 50 }).notNull().default("text"), // text, image, document, audio, video, location, contact
  
  // Dados específicos do WhatsApp/N8N
  external_id: varchar("external_id", { length: 255 }), // ID da mensagem no WhatsApp
  whatsapp_data: jsonb("whatsapp_data"), // Dados completos do webhook do WhatsApp
  
  // Status da mensagem
  status: varchar("status", { length: 50 }).notNull().default("sent"), // sent, delivered, read, failed
  direction: varchar("direction", { length: 20 }).notNull(), // inbound, outbound
  
  // Device type para identificar origem do envio
  device_type: varchar("device_type", { length: 20 }).notNull().default("manual"), // system, manual
  
  // Resposta da AI (se aplicável)
  ai_generated: boolean("ai_generated").default(false),
  ai_context: jsonb("ai_context"), // Contexto usado pela AI para gerar a resposta
  
  // Timestamps
  sent_at: timestamp("sent_at"),
  delivered_at: timestamp("delivered_at"),
  read_at: timestamp("read_at"),
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_messages_conversation").on(table.conversation_id, table.created_at),
  index("idx_messages_external").on(table.external_id),
  index("idx_messages_status").on(table.status, table.direction),
]);

// Tabela de anexos
export const message_attachments = pgTable("message_attachments", {
  id: serial("id").primaryKey(),
  message_id: integer("message_id").notNull(),
  clinic_id: integer("clinic_id").notNull(),
  
  // Informações do arquivo
  file_name: varchar("file_name", { length: 255 }).notNull(),
  file_type: varchar("file_type", { length: 100 }).notNull(), // mime type
  file_size: integer("file_size"), // em bytes
  file_url: text("file_url"), // URL do arquivo (local - mantido para compatibilidade)
  
  // Supabase Storage Integration (FASE 1 - Nova estrutura)
  storage_bucket: varchar("storage_bucket", { length: 100 }).default("conversation-attachments"),
  storage_path: varchar("storage_path", { length: 500 }), // Caminho no Supabase Storage
  public_url: text("public_url"), // URL pública (se aplicável)
  signed_url: text("signed_url"), // URL assinada temporária
  signed_url_expires: timestamp("signed_url_expires"), // Expiração da URL assinada
  
  // Dados do WhatsApp
  whatsapp_media_id: varchar("whatsapp_media_id", { length: 255 }),
  whatsapp_media_url: text("whatsapp_media_url"),
  
  // Metadata
  thumbnail_url: text("thumbnail_url"),
  duration: integer("duration"), // para áudio/vídeo em segundos
  width: integer("width"), // para imagens/vídeos
  height: integer("height"), // para imagens/vídeos
  
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_attachments_message").on(table.message_id),
  index("idx_attachments_clinic").on(table.clinic_id),
  index("idx_attachments_storage_path").on(table.storage_path), // Supabase Storage index
]);

// Zod schemas para validação
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  created_at: true,
  updated_at: true,
}).extend({
  status: z.enum(['active', 'archived', 'closed']).default('active'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  clinic_id: z.number().min(1),
  contact_id: z.number().min(1),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  created_at: true,
}).extend({
  sender_type: z.enum(['professional', 'patient', 'system', 'ai']),
  message_type: z.enum(['text', 'image', 'document', 'audio', 'video', 'location', 'contact']).default('text'),
  status: z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
  direction: z.enum(['inbound', 'outbound']),
  device_type: z.enum(['system', 'manual']).default('manual'),
  conversation_id: z.bigint(),
});

export const insertMessageAttachmentSchema = createInsertSchema(message_attachments).omit({
  id: true,
  created_at: true,
}).extend({
  clinic_id: z.number().min(1),
  message_id: z.number().min(1),
});

// Types para TypeScript
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type MessageAttachment = typeof message_attachments.$inferSelect;
export type InsertMessageAttachment = z.infer<typeof insertMessageAttachmentSchema>;

// Tabela para ações/notificações nas conversas (agendamentos, mudanças de status, etc)
export const conversation_actions = pgTable("conversation_actions", {
  id: serial("id").primaryKey(),
  clinic_id: integer("clinic_id").notNull(),
  conversation_id: bigint("conversation_id", { mode: "bigint" }).references(() => conversations.conversation_id),
  
  // Tipo de ação
  action_type: varchar("action_type", { length: 50 }).notNull(), // appointment_created, appointment_status_changed, etc
  title: varchar("title", { length: 255 }).notNull(), // "Consulta agendada"
  description: text("description").notNull(), // "Consulta agendada para 28/06 às 14:00 com Dra. Paula"
  
  // Metadata da ação (dados específicos para cada tipo)
  metadata: jsonb("metadata"), // { appointment_id, doctor_name, date, time, old_status, new_status, etc }
  
  // Referência para entidade relacionada (ex: appointment_id)
  related_entity_type: varchar("related_entity_type", { length: 50 }), // appointment, contact, etc
  related_entity_id: integer("related_entity_id"),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_conversation_actions_conversation").on(table.conversation_id, table.created_at),
  index("idx_conversation_actions_clinic").on(table.clinic_id, table.created_at),
  index("idx_conversation_actions_type").on(table.action_type),
]);

export const insertConversationActionSchema = createInsertSchema(conversation_actions).omit({
  id: true,
  created_at: true,
}).extend({
  action_type: z.enum(['appointment_created', 'appointment_status_changed', 'appointment_cancelled', 'contact_created']),
  clinic_id: z.number().min(1),
  conversation_id: z.bigint(),
});

export type ConversationAction = typeof conversation_actions.$inferSelect;
export type InsertConversationAction = z.infer<typeof insertConversationActionSchema>;