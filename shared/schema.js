"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUserSchema = exports.updateLiviaConfigurationSchema = exports.insertLiviaConfigurationSchema = exports.livia_configurations = exports.insertN8NChatMessageSchema = exports.n8n_chat_messages = exports.insertConversationActionSchema = exports.conversation_actions = exports.insertMessageAttachmentSchema = exports.insertMessageSchema = exports.insertConversationSchema = exports.message_attachments = exports.messages = exports.conversations = exports.insertSystemLogSchema = exports.system_logs = exports.selectDocumentSchema = exports.insertDocumentSchema = exports.updateKnowledgeBaseSchema = exports.insertKnowledgeBaseSchema = exports.documents = exports.knowledge_bases = exports.insertMaraProfessionalConfigSchema = exports.mara_professional_configs = exports.insertPipelineActivitySchema = exports.insertPipelineHistorySchema = exports.insertPipelineOpportunitySchema = exports.insertAnamnesisResponseSchema = exports.insertAnamnesisTemplateSchema = exports.anamnesis_responses = exports.anamnesis_templates = exports.insertPipelineStageSchema = exports.insertAiTemplateSchema = exports.insertApiKeySchema = exports.insertWhatsAppNumberSchema = exports.insertAnalyticsMetricSchema = exports.insertAppointmentTagSchema = exports.api_keys = exports.pipeline_activities = exports.pipeline_history = exports.pipeline_opportunities = exports.pipeline_stages = exports.ai_templates = exports.analytics_metrics = exports.appointment_tags = exports.whatsapp_numbers = exports.sessions = exports.clinics = exports.clinic_users = exports.users = void 0;
exports.insertPasswordResetTokenSchema = exports.password_reset_tokens = exports.insertClinicInvitationSchema = exports.clinic_invitations = exports.insertAppointmentSchema = exports.appointments = exports.insertContactSchema = exports.contacts = exports.insertClinicSchema = exports.insertClinicUserSchema = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    email: (0, pg_core_1.varchar)("email").notNull().unique(),
    password: (0, pg_core_1.varchar)("password").notNull(),
    name: (0, pg_core_1.varchar)("name").notNull(),
    role: (0, pg_core_1.varchar)("role").notNull().default("admin"),
    is_active: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    last_login: (0, pg_core_1.timestamp)("last_login"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.clinic_users = (0, pg_core_1.pgTable)("clinic_users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    user_id: (0, pg_core_1.integer)("user_id").notNull(),
    role: (0, pg_core_1.varchar)("role").notNull().default("usuario"),
    is_professional: (0, pg_core_1.boolean)("is_professional").notNull().default(false),
    permissions: (0, pg_core_1.jsonb)("permissions"),
    is_active: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    invited_by: (0, pg_core_1.integer)("invited_by"),
    invited_at: (0, pg_core_1.timestamp)("invited_at"),
    joined_at: (0, pg_core_1.timestamp)("joined_at"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)().on(table.clinic_id, table.user_id),
    (0, pg_core_1.index)("idx_clinic_users_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_clinic_users_user").on(table.user_id),
    (0, pg_core_1.index)("idx_clinic_users_professional").on(table.is_professional),
]);
exports.clinics = (0, pg_core_1.pgTable)("clinics", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    responsible: (0, pg_core_1.text)("responsible").notNull(),
    phone: (0, pg_core_1.text)("phone"),
    phone_country_code: (0, pg_core_1.text)("phone_country_code").default("+55"),
    celular: (0, pg_core_1.text)("celular").notNull(),
    celular_country_code: (0, pg_core_1.text)("celular_country_code").default("+55"),
    email: (0, pg_core_1.text)("email"),
    specialties: (0, pg_core_1.text)("specialties").array(),
    address_street: (0, pg_core_1.text)("address_street"),
    address_number: (0, pg_core_1.text)("address_number"),
    address_complement: (0, pg_core_1.text)("address_complement"),
    address_neighborhood: (0, pg_core_1.text)("address_neighborhood"),
    address_city: (0, pg_core_1.text)("address_city"),
    address_state: (0, pg_core_1.text)("address_state"),
    address_zip: (0, pg_core_1.text)("address_zip"),
    address_country: (0, pg_core_1.text)("address_country").default("BR"),
    total_professionals: (0, pg_core_1.integer)("total_professionals").default(1),
    working_days: (0, pg_core_1.text)("working_days").array().default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
    work_start: (0, pg_core_1.text)("work_start").default("08:00"),
    work_end: (0, pg_core_1.text)("work_end").default("18:00"),
    has_lunch_break: (0, pg_core_1.boolean)("has_lunch_break").default(true),
    lunch_start: (0, pg_core_1.text)("lunch_start").default("12:00"),
    lunch_end: (0, pg_core_1.text)("lunch_end").default("13:00"),
    timezone: (0, pg_core_1.text)("timezone").default("America/Sao_Paulo"),
    cnpj: (0, pg_core_1.text)("cnpj"),
    website: (0, pg_core_1.text)("website"),
    description: (0, pg_core_1.text)("description"),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).notNull().default("active"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, (table) => [(0, pg_core_1.index)("IDX_session_expire").on(table.expire)]);
exports.whatsapp_numbers = (0, pg_core_1.pgTable)("whatsapp_numbers", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    user_id: (0, pg_core_1.integer)("user_id").notNull(),
    phone_number: (0, pg_core_1.text)("phone_number").notNull(),
    instance_name: (0, pg_core_1.text)("instance_name").notNull(),
    status: (0, pg_core_1.text)("status").notNull().default("disconnected"),
    connected_at: (0, pg_core_1.timestamp)("connected_at"),
    disconnected_at: (0, pg_core_1.timestamp)("disconnected_at"),
    last_seen: (0, pg_core_1.timestamp)("last_seen"),
    is_deleted: (0, pg_core_1.boolean)("is_deleted").default(false),
    deleted_at: (0, pg_core_1.timestamp)("deleted_at"),
    deleted_by_user_id: (0, pg_core_1.integer)("deleted_by_user_id"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_whatsapp_numbers_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_whatsapp_numbers_user").on(table.user_id),
    (0, pg_core_1.index)("idx_whatsapp_numbers_deleted").on(table.is_deleted),
    (0, pg_core_1.unique)("unique_phone_clinic").on(table.phone_number, table.clinic_id),
    (0, pg_core_1.unique)("unique_instance_name").on(table.instance_name),
]);
exports.appointment_tags = (0, pg_core_1.pgTable)("appointment_tags", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    color: (0, pg_core_1.text)("color").notNull(),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_appointment_tags_clinic").on(table.clinic_id),
]);
exports.analytics_metrics = (0, pg_core_1.pgTable)("analytics_metrics", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    metric_type: (0, pg_core_1.text)("metric_type").notNull(),
    value: (0, pg_core_1.integer)("value").notNull(),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    metadata: (0, pg_core_1.text)("metadata"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.ai_templates = (0, pg_core_1.pgTable)("ai_templates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    template_name: (0, pg_core_1.text)("template_name").notNull(),
    template_type: (0, pg_core_1.text)("template_type").notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    variables: (0, pg_core_1.text)("variables").array(),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.pipeline_stages = (0, pg_core_1.pgTable)("pipeline_stages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    order_index: (0, pg_core_1.integer)("order_index").notNull(),
    color: (0, pg_core_1.text)("color").default("#3B82F6"),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.pipeline_opportunities = (0, pg_core_1.pgTable)("pipeline_opportunities", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    stage_id: (0, pg_core_1.integer)("stage_id").notNull(),
    contact_id: (0, pg_core_1.integer)("contact_id").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    value: (0, pg_core_1.integer)("value"),
    probability: (0, pg_core_1.integer)("probability").default(50),
    expected_close_date: (0, pg_core_1.timestamp)("expected_close_date"),
    assigned_to: (0, pg_core_1.text)("assigned_to"),
    status: (0, pg_core_1.text)("status").default("active"),
    tags: (0, pg_core_1.text)("tags").array(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.pipeline_history = (0, pg_core_1.pgTable)("pipeline_history", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    opportunity_id: (0, pg_core_1.integer)("opportunity_id").notNull(),
    from_stage_id: (0, pg_core_1.integer)("from_stage_id"),
    to_stage_id: (0, pg_core_1.integer)("to_stage_id").notNull(),
    changed_by: (0, pg_core_1.text)("changed_by").notNull(),
    change_reason: (0, pg_core_1.text)("change_reason"),
    notes: (0, pg_core_1.text)("notes"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.pipeline_activities = (0, pg_core_1.pgTable)("pipeline_activities", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    opportunity_id: (0, pg_core_1.integer)("opportunity_id").notNull(),
    activity_type: (0, pg_core_1.text)("activity_type").notNull(),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    scheduled_date: (0, pg_core_1.timestamp)("scheduled_date"),
    completed_date: (0, pg_core_1.timestamp)("completed_date"),
    assigned_to: (0, pg_core_1.text)("assigned_to").notNull(),
    status: (0, pg_core_1.text)("status").default("pending"),
    outcome: (0, pg_core_1.text)("outcome"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.api_keys = (0, pg_core_1.pgTable)("api_keys", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    key_name: (0, pg_core_1.varchar)("key_name", { length: 255 }).notNull(),
    api_key: (0, pg_core_1.varchar)("api_key", { length: 64 }).notNull(),
    key_hash: (0, pg_core_1.text)("key_hash").notNull(),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    permissions: (0, pg_core_1.jsonb)("permissions").default(['read', 'write']),
    last_used_at: (0, pg_core_1.timestamp)("last_used_at"),
    usage_count: (0, pg_core_1.integer)("usage_count").default(0),
    expires_at: (0, pg_core_1.timestamp)("expires_at"),
    created_by: (0, pg_core_1.integer)("created_by"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("unique_api_key").on(table.api_key),
    (0, pg_core_1.index)("idx_api_keys_key").on(table.api_key),
    (0, pg_core_1.index)("idx_api_keys_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_api_keys_active").on(table.is_active),
]);
exports.insertAppointmentTagSchema = (0, drizzle_zod_1.createInsertSchema)(exports.appointment_tags).extend({
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve estar no formato hexadecimal"),
});
exports.insertAnalyticsMetricSchema = (0, drizzle_zod_1.createInsertSchema)(exports.analytics_metrics);
exports.insertWhatsAppNumberSchema = (0, drizzle_zod_1.createInsertSchema)(exports.whatsapp_numbers).omit({
    id: true,
    created_at: true,
    updated_at: true,
}).extend({
    phone_number: zod_1.z.string().min(1, "Número do telefone é obrigatório"),
    instance_name: zod_1.z.string().min(1, "Nome da instância é obrigatório"),
    status: zod_1.z.enum(['connected', 'disconnected', 'connecting', 'error']).default('disconnected'),
});
exports.insertApiKeySchema = (0, drizzle_zod_1.createInsertSchema)(exports.api_keys).omit({
    id: true,
    api_key: true,
    key_hash: true,
    created_at: true,
    updated_at: true,
    last_used_at: true,
    usage_count: true,
}).extend({
    key_name: zod_1.z.string().min(1, "Nome da API Key é obrigatório").max(255),
    permissions: zod_1.z.array(zod_1.z.enum(['read', 'write', 'admin'])).default(['read', 'write']),
});
exports.insertAiTemplateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.ai_templates);
exports.insertPipelineStageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.pipeline_stages);
exports.anamnesis_templates = (0, pg_core_1.pgTable)("anamnesis_templates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    fields: (0, pg_core_1.jsonb)("fields").notNull(),
    is_default: (0, pg_core_1.boolean)("is_default").default(false),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_by: (0, pg_core_1.uuid)("created_by"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_anamnesis_templates_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_anamnesis_templates_default").on(table.is_default),
]);
exports.anamnesis_responses = (0, pg_core_1.pgTable)("anamnesis_responses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    contact_id: (0, pg_core_1.integer)("contact_id").notNull(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    template_id: (0, pg_core_1.integer)("template_id").notNull(),
    responses: (0, pg_core_1.jsonb)("responses").notNull(),
    status: (0, pg_core_1.text)("status").default("pending"),
    share_token: (0, pg_core_1.text)("share_token").notNull(),
    patient_name: (0, pg_core_1.text)("patient_name"),
    patient_email: (0, pg_core_1.text)("patient_email"),
    patient_phone: (0, pg_core_1.text)("patient_phone"),
    completed_at: (0, pg_core_1.timestamp)("completed_at"),
    expires_at: (0, pg_core_1.timestamp)("expires_at"),
    created_by: (0, pg_core_1.uuid)("created_by"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("unique_share_token").on(table.share_token),
    (0, pg_core_1.index)("idx_anamnesis_responses_contact").on(table.contact_id),
    (0, pg_core_1.index)("idx_anamnesis_responses_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_anamnesis_responses_token").on(table.share_token),
    (0, pg_core_1.index)("idx_anamnesis_responses_status").on(table.status),
]);
exports.insertAnamnesisTemplateSchema = (0, drizzle_zod_1.createInsertSchema)(exports.anamnesis_templates).omit({
    id: true,
    created_at: true,
    updated_at: true,
}).extend({
    name: zod_1.z.string().min(1, "Nome do template é obrigatório"),
    fields: zod_1.z.object({
        questions: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            text: zod_1.z.string(),
            type: zod_1.z.enum(['text', 'radio', 'checkbox', 'textarea']),
            options: zod_1.z.array(zod_1.z.string()).optional(),
            required: zod_1.z.boolean().default(false),
            additionalInfo: zod_1.z.boolean().default(false),
        })),
    }),
});
exports.insertAnamnesisResponseSchema = (0, drizzle_zod_1.createInsertSchema)(exports.anamnesis_responses).omit({
    id: true,
    created_at: true,
    updated_at: true,
}).extend({
    responses: zod_1.z.record(zod_1.z.any()),
    patient_name: zod_1.z.string().min(1, "Nome do paciente é obrigatório"),
    patient_email: zod_1.z.string().email("Email inválido").optional(),
    patient_phone: zod_1.z.string().optional(),
});
exports.insertPipelineOpportunitySchema = (0, drizzle_zod_1.createInsertSchema)(exports.pipeline_opportunities);
exports.insertPipelineHistorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.pipeline_history);
exports.insertPipelineActivitySchema = (0, drizzle_zod_1.createInsertSchema)(exports.pipeline_activities);
exports.mara_professional_configs = (0, pg_core_1.pgTable)("mara_professional_configs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    professional_id: (0, pg_core_1.integer)("professional_id").notNull(),
    knowledge_base_id: (0, pg_core_1.integer)("knowledge_base_id"),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_mara_configs_clinic_professional").on(table.clinic_id, table.professional_id),
    (0, pg_core_1.index)("idx_mara_configs_knowledge_base").on(table.knowledge_base_id),
    (0, pg_core_1.unique)("unique_clinic_professional").on(table.clinic_id, table.professional_id),
]);
exports.insertMaraProfessionalConfigSchema = (0, drizzle_zod_1.createInsertSchema)(exports.mara_professional_configs);
exports.knowledge_bases = (0, pg_core_1.pgTable)("knowledge_bases", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
    created_by: (0, pg_core_1.text)("created_by"),
}, (table) => [
    (0, pg_core_1.index)("idx_knowledge_bases_clinic").on(table.clinic_id),
]);
exports.documents = (0, pg_core_1.pgTable)("documents", {
    id: (0, pg_core_1.bigint)("id", { mode: "bigint" }).primaryKey(),
    content: (0, pg_core_1.text)("content"),
    metadata: (0, pg_core_1.jsonb)("metadata"),
    embedding: (0, pg_core_1.vector)("embedding", { dimensions: 1536 }),
});
exports.insertKnowledgeBaseSchema = (0, drizzle_zod_1.createInsertSchema)(exports.knowledge_bases).omit({
    id: true,
    created_at: true,
    updated_at: true,
}).extend({
    clinic_id: zod_1.z.number().min(1, "clinic_id é obrigatório"),
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    description: zod_1.z.string().optional(),
    created_by: zod_1.z.string().optional(),
});
exports.updateKnowledgeBaseSchema = exports.insertKnowledgeBaseSchema.partial().extend({
    clinic_id: zod_1.z.number().min(1, "clinic_id é obrigatório"),
});
exports.insertDocumentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.documents).omit({
    id: true,
}).extend({
    content: zod_1.z.string().min(1, "Content é obrigatório"),
    metadata: zod_1.z.object({
        clinic_id: zod_1.z.number().min(1, "clinic_id é obrigatório"),
        knowledge_base_id: zod_1.z.number().optional(),
        livia_configuration_id: zod_1.z.number().optional(),
        document_title: zod_1.z.string().optional(),
        source: zod_1.z.string().optional(),
        chunk_index: zod_1.z.number().optional(),
    }).passthrough(),
});
exports.selectDocumentSchema = zod_1.z.object({
    id: zod_1.z.bigint(),
    content: zod_1.z.string().nullable(),
    metadata: zod_1.z.record(zod_1.z.any()).nullable(),
    embedding: zod_1.z.array(zod_1.z.number()).nullable(),
});
exports.system_logs = (0, pg_core_1.pgTable)("system_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    entity_type: (0, pg_core_1.varchar)("entity_type", { length: 50 }).notNull(),
    entity_id: (0, pg_core_1.integer)("entity_id"),
    action_type: (0, pg_core_1.varchar)("action_type", { length: 100 }).notNull(),
    actor_id: (0, pg_core_1.uuid)("actor_id"),
    actor_type: (0, pg_core_1.varchar)("actor_type", { length: 50 }),
    actor_name: (0, pg_core_1.varchar)("actor_name", { length: 255 }),
    professional_id: (0, pg_core_1.integer)("professional_id"),
    related_entity_id: (0, pg_core_1.integer)("related_entity_id"),
    previous_data: (0, pg_core_1.jsonb)("previous_data"),
    new_data: (0, pg_core_1.jsonb)("new_data"),
    changes: (0, pg_core_1.jsonb)("changes"),
    source: (0, pg_core_1.varchar)("source", { length: 50 }),
    ip_address: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    user_agent: (0, pg_core_1.text)("user_agent"),
    session_id: (0, pg_core_1.varchar)("session_id", { length: 255 }),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_logs_clinic_entity").on(table.clinic_id, table.entity_type, table.entity_id),
    (0, pg_core_1.index)("idx_logs_actor").on(table.clinic_id, table.actor_id, table.created_at),
    (0, pg_core_1.index)("idx_logs_timeline").on(table.clinic_id, table.created_at),
    (0, pg_core_1.index)("idx_logs_professional").on(table.clinic_id, table.professional_id, table.created_at),
    (0, pg_core_1.index)("idx_logs_entity_type").on(table.entity_type, table.action_type),
]);
exports.insertSystemLogSchema = (0, drizzle_zod_1.createInsertSchema)(exports.system_logs).omit({
    id: true,
    created_at: true,
}).extend({
    entity_type: zod_1.z.enum(['contact', 'appointment', 'message', 'conversation', 'medical_record', 'anamnesis', 'whatsapp_number']),
    action_type: zod_1.z.enum([
        'created', 'updated', 'deleted', 'status_changed',
        'sent', 'received', 'ai_response', 'filled', 'reviewed',
        'rescheduled', 'no_show', 'completed', 'cancelled',
        'connected', 'disconnected', 'archived'
    ]),
    actor_type: zod_1.z.enum(['professional', 'patient', 'system', 'ai']).optional(),
    clinic_id: zod_1.z.number().min(1, "Clinic ID é obrigatório"),
});
exports.conversations = (0, pg_core_1.pgTable)("conversations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    contact_id: (0, pg_core_1.integer)("contact_id").notNull(),
    professional_id: (0, pg_core_1.integer)("professional_id"),
    whatsapp_number_id: (0, pg_core_1.integer)("whatsapp_number_id"),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).notNull().default("active"),
    title: (0, pg_core_1.varchar)("title", { length: 255 }),
    priority: (0, pg_core_1.varchar)("priority", { length: 20 }).default("normal"),
    ai_active: (0, pg_core_1.boolean)("ai_active").default(true),
    ai_paused_until: (0, pg_core_1.timestamp)("ai_paused_until"),
    ai_paused_by_user_id: (0, pg_core_1.integer)("ai_paused_by_user_id"),
    ai_pause_reason: (0, pg_core_1.varchar)("ai_pause_reason", { length: 100 }),
    total_messages: (0, pg_core_1.integer)("total_messages").default(0),
    unread_count: (0, pg_core_1.integer)("unread_count").default(0),
    last_message_at: (0, pg_core_1.timestamp)("last_message_at"),
    last_activity_at: (0, pg_core_1.timestamp)("last_activity_at").defaultNow(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_conversations_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_conversations_contact").on(table.contact_id),
    (0, pg_core_1.index)("idx_conversations_professional").on(table.professional_id),
    (0, pg_core_1.index)("idx_conversations_activity").on(table.clinic_id, table.last_activity_at),
    (0, pg_core_1.index)("idx_conversations_status").on(table.clinic_id, table.status),
]);
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    conversation_id: (0, pg_core_1.bigint)("conversation_id", { mode: "bigint" }).references(() => exports.conversations.id),
    sender_type: (0, pg_core_1.varchar)("sender_type", { length: 50 }).notNull(),
    sender_id: (0, pg_core_1.varchar)("sender_id", { length: 255 }),
    sender_name: (0, pg_core_1.varchar)("sender_name", { length: 255 }),
    content: (0, pg_core_1.text)("content"),
    message_type: (0, pg_core_1.varchar)("message_type", { length: 50 }).notNull().default("text"),
    external_id: (0, pg_core_1.varchar)("external_id", { length: 255 }),
    whatsapp_data: (0, pg_core_1.jsonb)("whatsapp_data"),
    status: (0, pg_core_1.varchar)("status", { length: 50 }).notNull().default("sent"),
    direction: (0, pg_core_1.varchar)("direction", { length: 20 }).notNull(),
    device_type: (0, pg_core_1.varchar)("device_type", { length: 20 }).notNull().default("manual"),
    ai_generated: (0, pg_core_1.boolean)("ai_generated").default(false),
    ai_context: (0, pg_core_1.jsonb)("ai_context"),
    sent_at: (0, pg_core_1.timestamp)("sent_at"),
    delivered_at: (0, pg_core_1.timestamp)("delivered_at"),
    read_at: (0, pg_core_1.timestamp)("read_at"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_messages_conversation").on(table.conversation_id, table.created_at),
    (0, pg_core_1.index)("idx_messages_external").on(table.external_id),
    (0, pg_core_1.index)("idx_messages_status").on(table.status, table.direction),
]);
exports.message_attachments = (0, pg_core_1.pgTable)("message_attachments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    message_id: (0, pg_core_1.integer)("message_id").notNull(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    file_name: (0, pg_core_1.varchar)("file_name", { length: 255 }).notNull(),
    file_type: (0, pg_core_1.varchar)("file_type", { length: 100 }).notNull(),
    file_size: (0, pg_core_1.integer)("file_size"),
    file_url: (0, pg_core_1.text)("file_url"),
    whatsapp_media_id: (0, pg_core_1.varchar)("whatsapp_media_id", { length: 255 }),
    whatsapp_media_url: (0, pg_core_1.text)("whatsapp_media_url"),
    thumbnail_url: (0, pg_core_1.text)("thumbnail_url"),
    duration: (0, pg_core_1.integer)("duration"),
    width: (0, pg_core_1.integer)("width"),
    height: (0, pg_core_1.integer)("height"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_attachments_message").on(table.message_id),
    (0, pg_core_1.index)("idx_attachments_clinic").on(table.clinic_id),
]);
exports.insertConversationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.conversations).omit({
    id: true,
    created_at: true,
    updated_at: true,
}).extend({
    status: zod_1.z.enum(['active', 'archived', 'closed']).default('active'),
    priority: zod_1.z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    ai_active: zod_1.z.boolean().default(true),
    clinic_id: zod_1.z.number().min(1),
    contact_id: zod_1.z.number().min(1),
});
exports.insertMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.messages).omit({
    id: true,
    created_at: true,
}).extend({
    sender_type: zod_1.z.enum(['professional', 'patient', 'system', 'ai']),
    message_type: zod_1.z.enum(['text', 'image', 'document', 'audio', 'video', 'location', 'contact']).default('text'),
    status: zod_1.z.enum(['sent', 'delivered', 'read', 'failed']).default('sent'),
    direction: zod_1.z.enum(['inbound', 'outbound']),
    device_type: zod_1.z.enum(['system', 'manual']).default('manual'),
    conversation_id: zod_1.z.bigint(),
});
exports.insertMessageAttachmentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.message_attachments).omit({
    id: true,
    created_at: true,
}).extend({
    clinic_id: zod_1.z.number().min(1),
    message_id: zod_1.z.number().min(1),
});
exports.conversation_actions = (0, pg_core_1.pgTable)("conversation_actions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    conversation_id: (0, pg_core_1.bigint)("conversation_id", { mode: "bigint" }).references(() => exports.conversations.id),
    action_type: (0, pg_core_1.varchar)("action_type", { length: 50 }).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 255 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    metadata: (0, pg_core_1.jsonb)("metadata"),
    related_entity_type: (0, pg_core_1.varchar)("related_entity_type", { length: 50 }),
    related_entity_id: (0, pg_core_1.integer)("related_entity_id"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_conversation_actions_conversation").on(table.conversation_id, table.created_at),
    (0, pg_core_1.index)("idx_conversation_actions_clinic").on(table.clinic_id, table.created_at),
    (0, pg_core_1.index)("idx_conversation_actions_type").on(table.action_type),
]);
exports.insertConversationActionSchema = (0, drizzle_zod_1.createInsertSchema)(exports.conversation_actions).omit({
    id: true,
    created_at: true,
}).extend({
    action_type: zod_1.z.enum(['appointment_created', 'appointment_status_changed', 'appointment_cancelled', 'contact_created']),
    clinic_id: zod_1.z.number().min(1),
    conversation_id: zod_1.z.bigint(),
});
exports.n8n_chat_messages = (0, pg_core_1.pgTable)("n8n_chat_messages", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    session_id: (0, pg_core_1.varchar)("session_id", { length: 255 }).notNull(),
    message: (0, pg_core_1.jsonb)("message").notNull(),
}, (table) => [
    (0, pg_core_1.index)("idx_n8n_chat_messages_session").on(table.session_id),
]);
exports.insertN8NChatMessageSchema = (0, drizzle_zod_1.createInsertSchema)(exports.n8n_chat_messages).omit({
    id: true,
}).extend({
    session_id: zod_1.z.string().min(1),
    message: zod_1.z.object({
        type: zod_1.z.literal("human"),
        content: zod_1.z.string(),
        additional_kwargs: zod_1.z.object({}),
        response_metadata: zod_1.z.object({})
    })
});
exports.livia_configurations = (0, pg_core_1.pgTable)("livia_configurations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull().unique(),
    general_prompt: (0, pg_core_1.text)("general_prompt").notNull().default(`Você é Livia, assistente virtual especializada da nossa clínica médica. Seja sempre empática, profissional e prestativa.

Suas principais responsabilidades:
- Responder dúvidas sobre procedimentos e horários
- Auxiliar no agendamento de consultas
- Fornecer informações gerais sobre a clínica
- Identificar situações de urgência

Mantenha um tom acolhedor e use linguagem simples. Em caso de dúvidas médicas específicas, sempre oriente a procurar um profissional.`),
    whatsapp_number_id: (0, pg_core_1.integer)("whatsapp_number_id"),
    off_duration: (0, pg_core_1.integer)("off_duration").notNull().default(30),
    off_unit: (0, pg_core_1.varchar)("off_unit", { length: 10 }).notNull().default("minutos"),
    selected_professional_ids: (0, pg_core_1.integer)("selected_professional_ids").array().default([]),
    connected_knowledge_base_ids: (0, pg_core_1.integer)("connected_knowledge_base_ids").array().default([]),
    is_active: (0, pg_core_1.boolean)("is_active").default(true),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => [
    (0, pg_core_1.index)("idx_livia_configurations_clinic").on(table.clinic_id),
    (0, pg_core_1.index)("idx_livia_configurations_whatsapp").on(table.whatsapp_number_id),
    (0, pg_core_1.index)("idx_livia_configurations_active").on(table.is_active),
]);
exports.insertLiviaConfigurationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.livia_configurations).omit({
    id: true,
    created_at: true,
    updated_at: true,
}).extend({
    clinic_id: zod_1.z.number().min(1, "Clinic ID é obrigatório"),
    general_prompt: zod_1.z.string().min(10, "Prompt deve ter pelo menos 10 caracteres"),
    whatsapp_number_id: zod_1.z.number().nullable().optional(),
    off_duration: zod_1.z.number().min(1, "Duração deve ser pelo menos 1").max(999, "Duração muito alta"),
    off_unit: zod_1.z.enum(["minutos", "horas", "dias"]),
    selected_professional_ids: zod_1.z.array(zod_1.z.number()).optional(),
    connected_knowledge_base_ids: zod_1.z.array(zod_1.z.number()).optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.updateLiviaConfigurationSchema = exports.insertLiviaConfigurationSchema.partial().extend({
    clinic_id: zod_1.z.number().min(1, "Clinic ID é obrigatório"),
    whatsapp_number_id: zod_1.z.number().nullable().optional(),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users);
exports.insertClinicUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.clinic_users);
exports.insertClinicSchema = (0, drizzle_zod_1.createInsertSchema)(exports.clinics);
exports.contacts = (0, pg_core_1.pgTable)("contacts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    name: (0, pg_core_1.text)("name").notNull(),
    phone: (0, pg_core_1.text)("phone"),
    email: (0, pg_core_1.text)("email"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertContactSchema = (0, drizzle_zod_1.createInsertSchema)(exports.contacts);
exports.appointments = (0, pg_core_1.pgTable)("appointments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    contact_id: (0, pg_core_1.integer)("contact_id").notNull(),
    clinic_id: (0, pg_core_1.integer)("clinic_id").notNull(),
    user_id: (0, pg_core_1.integer)("user_id").notNull(),
    scheduled_date: (0, pg_core_1.timestamp)("scheduled_date"),
    status: (0, pg_core_1.text)("status").notNull(),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertAppointmentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.appointments);
exports.clinic_invitations = (0, pg_core_1.pgTable)("clinic_invitations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    email: (0, pg_core_1.varchar)("email").notNull(),
    admin_name: (0, pg_core_1.varchar)("admin_name").notNull(),
    clinic_name: (0, pg_core_1.varchar)("clinic_name").notNull(),
    token: (0, pg_core_1.varchar)("token").notNull().unique(),
    status: (0, pg_core_1.varchar)("status").notNull().default("pending"),
    expires_at: (0, pg_core_1.timestamp)("expires_at").notNull(),
    created_by_user_id: (0, pg_core_1.integer)("created_by_user_id").notNull(),
    clinic_id: (0, pg_core_1.integer)("clinic_id"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertClinicInvitationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.clinic_invitations);
exports.password_reset_tokens = (0, pg_core_1.pgTable)("password_reset_tokens", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    user_id: (0, pg_core_1.integer)("user_id").notNull(),
    token: (0, pg_core_1.varchar)("token").notNull().unique(),
    expires_at: (0, pg_core_1.timestamp)("expires_at").notNull(),
    used: (0, pg_core_1.boolean)("used").notNull().default(false),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertPasswordResetTokenSchema = (0, drizzle_zod_1.createInsertSchema)(exports.password_reset_tokens);
