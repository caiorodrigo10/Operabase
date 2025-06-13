CREATE TABLE "ai_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer,
	"template_name" text NOT NULL,
	"template_type" text NOT NULL,
	"content" text NOT NULL,
	"variables" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "analytics_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer,
	"metric_type" text NOT NULL,
	"value" integer NOT NULL,
	"date" timestamp NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"clinic_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"doctor_name" text,
	"specialty" text,
	"appointment_type" text,
	"scheduled_date" timestamp,
	"duration_minutes" integer DEFAULT 60,
	"status" text NOT NULL,
	"cancellation_reason" text,
	"session_notes" text,
	"next_appointment_suggested" timestamp,
	"payment_status" text DEFAULT 'pendente',
	"payment_amount" integer,
	"google_calendar_event_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"clinic_id" integer NOT NULL,
	"provider" text NOT NULL,
	"email" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"calendar_id" text,
	"sync_preference" text DEFAULT 'one-way',
	"is_active" boolean DEFAULT true,
	"last_sync" timestamp,
	"sync_errors" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"calendar_name" text,
	"ical_uid" text,
	CONSTRAINT "calendar_integrations_user_id_email_provider_unique" UNIQUE("user_id","email","provider")
);
--> statement-breakpoint
CREATE TABLE "clinic_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer NOT NULL,
	"email" varchar NOT NULL,
	"role" varchar NOT NULL,
	"permissions" jsonb,
	"token" varchar NOT NULL,
	"invited_by" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "clinic_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "clinic_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clinic_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar DEFAULT 'user' NOT NULL,
	"permissions" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"invited_by" integer,
	"invited_at" timestamp,
	"joined_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "clinic_users_clinic_id_user_id_unique" UNIQUE("clinic_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "clinics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"responsible" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"specialties" text[],
	"working_hours" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"age" integer,
	"gender" text,
	"profession" text,
	"address" text,
	"emergency_contact" text,
	"medical_history" text,
	"current_medications" text[],
	"allergies" text[],
	"status" text NOT NULL,
	"priority" text DEFAULT 'normal',
	"source" text DEFAULT 'whatsapp',
	"notes" text,
	"first_contact" timestamp DEFAULT now(),
	"last_interaction" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer,
	"clinic_id" integer,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "medical_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"appointment_id" integer,
	"contact_id" integer NOT NULL,
	"clinic_id" integer NOT NULL,
	"record_type" text DEFAULT 'consultation' NOT NULL,
	"content" text,
	"chief_complaint" text,
	"history_present_illness" text,
	"physical_examination" text,
	"diagnosis" text,
	"treatment_plan" text,
	"prescriptions" jsonb,
	"exam_requests" jsonb,
	"follow_up_instructions" text,
	"observations" text,
	"vital_signs" jsonb,
	"attachments" text[],
	"voice_transcription" text,
	"ai_summary" text,
	"templates_used" text[],
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"ai_action" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "pipeline_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunity_id" integer,
	"activity_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"scheduled_date" timestamp,
	"completed_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"outcome" text,
	"next_activity_suggested" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunity_id" integer,
	"from_stage_id" integer,
	"to_stage_id" integer,
	"changed_by" text,
	"notes" text,
	"duration_in_stage" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer,
	"contact_id" integer,
	"stage_id" integer,
	"title" text NOT NULL,
	"description" text,
	"value" integer,
	"probability" integer DEFAULT 50,
	"expected_close_date" timestamp,
	"actual_close_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"lost_reason" text,
	"source" text,
	"assigned_to" text,
	"tags" text[],
	"priority" text DEFAULT 'medium',
	"next_action" text,
	"next_action_date" timestamp,
	"stage_entered_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"clinic_id" integer,
	"name" text NOT NULL,
	"description" text,
	"order_position" integer NOT NULL,
	"color" text DEFAULT '#3b82f6',
	"is_active" boolean DEFAULT true,
	"target_days" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"name" varchar NOT NULL,
	"role" varchar DEFAULT 'admin' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_templates" ADD CONSTRAINT "ai_templates_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_integrations" ADD CONSTRAINT "calendar_integrations_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinic_settings" ADD CONSTRAINT "clinic_settings_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_activities" ADD CONSTRAINT "pipeline_activities_opportunity_id_pipeline_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."pipeline_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_history" ADD CONSTRAINT "pipeline_history_opportunity_id_pipeline_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."pipeline_opportunities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_history" ADD CONSTRAINT "pipeline_history_from_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_history" ADD CONSTRAINT "pipeline_history_to_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_opportunities" ADD CONSTRAINT "pipeline_opportunities_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_opportunities" ADD CONSTRAINT "pipeline_opportunities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_opportunities" ADD CONSTRAINT "pipeline_opportunities_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_appointments_user" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_contact" ON "appointments" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_appointments_clinic" ON "appointments" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_user" ON "calendar_integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_clinic" ON "calendar_integrations" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_invitations_email" ON "clinic_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_invitations_token" ON "clinic_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_clinic_users_clinic" ON "clinic_users" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_clinic_users_user" ON "clinic_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_medical_records_appointment" ON "medical_records" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "idx_medical_records_contact" ON "medical_records" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "idx_medical_records_clinic" ON "medical_records" USING btree ("clinic_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_user" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");