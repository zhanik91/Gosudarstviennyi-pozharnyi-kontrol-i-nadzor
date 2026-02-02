CREATE TYPE "public"."admin_case_outcome" AS ENUM('warning', 'termination', 'other');--> statement-breakpoint
CREATE TYPE "public"."admin_case_payment_type" AS ENUM('voluntary', 'forced');--> statement-breakpoint
CREATE TYPE "public"."admin_case_status" AS ENUM('opened', 'in_review', 'resolved', 'closed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."admin_case_type" AS ENUM('protocol', 'resolution', 'appeal', 'other');--> statement-breakpoint
CREATE TYPE "public"."control_object_status" AS ENUM('active', 'inactive', 'under_inspection', 'violation', 'closed');--> statement-breakpoint
CREATE TYPE "public"."incident_type" AS ENUM('fire', 'nonfire', 'steppe_fire', 'steppe_smolder', 'co_nofire');--> statement-breakpoint
CREATE TYPE "public"."inspection_basis" AS ENUM('plan', 'prescription', 'prosecutor', 'complaint', 'pnsem', 'fire_incident', 'other');--> statement-breakpoint
CREATE TYPE "public"."inspection_status" AS ENUM('planned', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('scheduled', 'unscheduled', 'preventive_control', 'monitoring');--> statement-breakpoint
CREATE TYPE "public"."measure_status" AS ENUM('draft', 'issued', 'in_progress', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."measure_type" AS ENUM('warning', 'order', 'fine', 'suspension', 'other');--> statement-breakpoint
CREATE TYPE "public"."org_unit_type" AS ENUM('MCHS', 'DCHS', 'DISTRICT');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('government', 'small_business', 'medium_business', 'large_business', 'individual');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."prescription_status" AS ENUM('issued', 'in_progress', 'fulfilled', 'overdue', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."prescription_type" AS ENUM('primary', 'repeat', 'follow_up', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_form_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('MCHS', 'DCHS', 'DISTRICT');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('report_1_osp', 'report_2_ssg', 'report_3_spvp', 'report_4_sovp', 'report_5_spzhs', 'report_6_sspz', 'report_co', 'incident_photo', 'inspection_act', 'order', 'instruction', 'other');--> statement-breakpoint
CREATE TABLE "admin_cases" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" varchar,
	"number" varchar NOT NULL,
	"case_date" timestamp NOT NULL,
	"type" "admin_case_type" DEFAULT 'protocol' NOT NULL,
	"status" "admin_case_status" DEFAULT 'opened' NOT NULL,
	"payment_type" "admin_case_payment_type",
	"outcome" "admin_case_outcome" DEFAULT 'other',
	"region" varchar,
	"district" varchar,
	"bin" varchar,
	"iin" varchar,
	"article" text,
	"protocol_number" varchar,
	"protocol_date" timestamp,
	"offender_name" varchar,
	"offender_birth_date" timestamp,
	"offender_iin" varchar,
	"org_name" varchar,
	"org_bin" varchar,
	"inspector_name" varchar,
	"penalty_type" varchar,
	"resolution_date" timestamp,
	"fine_amount" numeric(15, 2),
	"fine_paid_voluntary" boolean,
	"fine_paid_reduced" boolean,
	"fine_paid_forced" boolean,
	"termination_reason" text,
	"termination_date" timestamp,
	"appeal_result" text,
	"appeal_decision_date" timestamp,
	"transfer_to" varchar,
	"transfer_type" varchar,
	"enforcement_sent" boolean,
	"offender_contact" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"action" varchar NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" varchar NOT NULL,
	"details" jsonb,
	"ip_address" varchar,
	"user_agent" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "control_objects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"category" varchar NOT NULL,
	"subcategory" varchar,
	"address" text NOT NULL,
	"region" varchar,
	"district" varchar,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"status" "control_object_status" DEFAULT 'active' NOT NULL,
	"risk_level" varchar DEFAULT 'medium',
	"last_inspection_date" timestamp,
	"next_inspection_date" timestamp,
	"description" text,
	"contact_person" varchar,
	"contact_phone" varchar,
	"details" jsonb,
	"organization_bin" varchar,
	"org_unit_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incident_victims" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"incident_id" varchar NOT NULL,
	"full_name" varchar,
	"gender" varchar NOT NULL,
	"age_group" varchar NOT NULL,
	"age" integer,
	"status" varchar NOT NULL,
	"victim_type" varchar NOT NULL,
	"social_status" varchar,
	"death_cause" varchar,
	"death_place" varchar,
	"condition" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date_time" timestamp NOT NULL,
	"locality" varchar NOT NULL,
	"incident_type" "incident_type" NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"cause" varchar,
	"cause_code" varchar,
	"cause_detailed" varchar,
	"object_type" varchar,
	"object_code" varchar,
	"object_detailed" varchar,
	"region" varchar,
	"city" varchar,
	"damage" numeric(15, 2) DEFAULT '0',
	"steppe_area" numeric(15, 2) DEFAULT '0',
	"steppe_damage" numeric(15, 2) DEFAULT '0',
	"steppe_people_total" integer DEFAULT 0,
	"steppe_people_dead" integer DEFAULT 0,
	"steppe_people_injured" integer DEFAULT 0,
	"steppe_animals_total" integer DEFAULT 0,
	"steppe_animals_dead" integer DEFAULT 0,
	"steppe_animals_injured" integer DEFAULT 0,
	"steppe_extinguished_total" integer DEFAULT 0,
	"steppe_extinguished_area" numeric(15, 2) DEFAULT '0',
	"steppe_extinguished_damage" numeric(15, 2) DEFAULT '0',
	"steppe_garrison_people" integer DEFAULT 0,
	"steppe_garrison_units" integer DEFAULT 0,
	"steppe_mchs_people" integer DEFAULT 0,
	"steppe_mchs_units" integer DEFAULT 0,
	"floor" integer,
	"total_floors" integer,
	"building_details" jsonb,
	"livestock_lost" jsonb,
	"destroyed_items" jsonb,
	"deaths_total" integer DEFAULT 0,
	"deaths_children" integer DEFAULT 0,
	"deaths_drunk" integer DEFAULT 0,
	"deaths_co_total" integer DEFAULT 0,
	"deaths_co_children" integer DEFAULT 0,
	"injured_total" integer DEFAULT 0,
	"injured_children" integer DEFAULT 0,
	"injured_co_total" integer DEFAULT 0,
	"injured_co_children" integer DEFAULT 0,
	"saved_people_total" integer DEFAULT 0,
	"saved_people_children" integer DEFAULT 0,
	"saved_property" numeric(15, 2) DEFAULT '0',
	"org_unit_id" varchar NOT NULL,
	"created_by" varchar NOT NULL,
	"package_id" varchar,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"archived_at" timestamp,
	"time_of_day" varchar,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar NOT NULL,
	"inspection_date" timestamp NOT NULL,
	"type" "inspection_type" NOT NULL,
	"status" "inspection_status" DEFAULT 'planned' NOT NULL,
	"ukpsisu_check_number" varchar,
	"ukpsisu_registration_date" timestamp,
	"assigning_authority" varchar,
	"registration_authority" varchar,
	"inspection_kind" varchar,
	"inspected_objects" text,
	"basis" text,
	"inspection_period" text,
	"extension_period" text,
	"suspension_resumption_dates" text,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"result" text,
	"violations_count" integer,
	"violations_deadline" timestamp,
	"ticket_registration_date" timestamp,
	"region" varchar,
	"district" varchar,
	"bin" varchar,
	"iin" varchar,
	"subject_name" varchar,
	"address" text,
	"org_unit_id" varchar,
	"created_by" varchar,
	"control_object_id" varchar,
	"organization_bin" varchar,
	"inspection_basis" "inspection_basis" DEFAULT 'plan',
	"risk_level" varchar,
	"parent_inspection_id" varchar,
	"is_follow_up_inspection" boolean DEFAULT false,
	"admin_responsibility_applied" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "measures" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"related_inspection_id" varchar,
	"number" varchar NOT NULL,
	"measure_date" timestamp NOT NULL,
	"type" "measure_type" NOT NULL,
	"status" "measure_status" DEFAULT 'draft' NOT NULL,
	"region" varchar,
	"district" varchar,
	"bin" varchar,
	"iin" varchar,
	"description" text,
	"parent_measure_id" varchar,
	"is_repeat" boolean DEFAULT false,
	"opened_at" timestamp,
	"due_date" timestamp,
	"closed_at" timestamp,
	"follow_up_inspection_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "normative_documents" (
	"id" varchar PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"short_title" varchar(100),
	"document_number" varchar(100),
	"document_date" varchar(50),
	"category" varchar(100) NOT NULL,
	"description" text,
	"external_url" varchar(1000) NOT NULL,
	"source" varchar(100) DEFAULT 'adilet',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar DEFAULT 'info',
	"is_read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "org_units" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "org_unit_type" NOT NULL,
	"name" varchar NOT NULL,
	"parent_id" varchar,
	"region_name" varchar DEFAULT '',
	"unit_name" varchar DEFAULT '',
	"code" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "org_units_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "organizations_registry" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bin" varchar NOT NULL,
	"iin" varchar,
	"name" varchar NOT NULL,
	"type" "organization_type" NOT NULL,
	"is_government" boolean DEFAULT false NOT NULL,
	"region" varchar,
	"district" varchar,
	"address" text,
	"auto_detected" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_registry_bin_unique" UNIQUE("bin")
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" varchar NOT NULL,
	"org_unit_id" varchar NOT NULL,
	"status" "package_status" DEFAULT 'draft' NOT NULL,
	"submitted_by" varchar,
	"submitted_at" timestamp,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" varchar NOT NULL,
	"number" varchar NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp,
	"type" "prescription_type" DEFAULT 'primary' NOT NULL,
	"status" "prescription_status" DEFAULT 'issued' NOT NULL,
	"region" varchar,
	"district" varchar,
	"bin" varchar,
	"iin" varchar,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "report_forms" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_unit_id" varchar NOT NULL,
	"period" varchar NOT NULL,
	"form" varchar NOT NULL,
	"data" jsonb NOT NULL,
	"status" "report_form_status" DEFAULT 'draft' NOT NULL,
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
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"full_name" varchar DEFAULT '',
	"region" varchar DEFAULT '',
	"district" varchar DEFAULT '',
	"email" text DEFAULT '' NOT NULL,
	"role" "user_role" DEFAULT 'DISTRICT' NOT NULL,
	"org_unit_id" varchar,
	"must_change_on_first_login" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_inspector" boolean DEFAULT false,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" varchar PRIMARY KEY NOT NULL,
	"workflow_id" varchar,
	"entity_id" varchar NOT NULL,
	"current_step" integer DEFAULT 0,
	"status" varchar DEFAULT 'pending',
	"data" jsonb,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"entity_type" varchar NOT NULL,
	"steps" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"comment" text NOT NULL,
	"comment_type" varchar DEFAULT 'general',
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_tag_relations" (
	"document_id" varchar NOT NULL,
	"tag_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_tags" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) DEFAULT '#3b82f6',
	"org_unit_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version" integer NOT NULL,
	"file_path" varchar,
	"file_name" varchar,
	"change_description" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"document_type" "document_type" NOT NULL,
	"file_path" varchar,
	"file_name" varchar,
	"file_size" integer,
	"mime_type" varchar,
	"period" varchar,
	"region" varchar,
	"org_unit_id" varchar NOT NULL,
	"status" "document_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_public" boolean DEFAULT false,
	"incident_id" varchar,
	"package_id" varchar,
	"created_by" varchar NOT NULL,
	"updated_by" varchar,
	"approved_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"approved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_cases" ADD CONSTRAINT "admin_cases_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measures" ADD CONSTRAINT "measures_related_inspection_id_inspections_id_fk" FOREIGN KEY ("related_inspection_id") REFERENCES "public"."inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normative_documents" ADD CONSTRAINT "normative_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_inspection_id_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."inspections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_cases_inspection_id_idx" ON "admin_cases" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "admin_cases_region_idx" ON "admin_cases" USING btree ("region");--> statement-breakpoint
CREATE INDEX "admin_cases_district_idx" ON "admin_cases" USING btree ("district");--> statement-breakpoint
CREATE INDEX "admin_cases_date_idx" ON "admin_cases" USING btree ("case_date");--> statement-breakpoint
CREATE INDEX "admin_cases_status_idx" ON "admin_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "admin_cases_bin_idx" ON "admin_cases" USING btree ("bin");--> statement-breakpoint
CREATE INDEX "admin_cases_iin_idx" ON "admin_cases" USING btree ("iin");--> statement-breakpoint
CREATE INDEX "admin_cases_number_idx" ON "admin_cases" USING btree ("number");--> statement-breakpoint
CREATE INDEX "admin_cases_article_idx" ON "admin_cases" USING btree ("article");--> statement-breakpoint
CREATE INDEX "admin_cases_protocol_number_idx" ON "admin_cases" USING btree ("protocol_number");--> statement-breakpoint
CREATE INDEX "admin_cases_protocol_date_idx" ON "admin_cases" USING btree ("protocol_date");--> statement-breakpoint
CREATE INDEX "admin_cases_offender_iin_idx" ON "admin_cases" USING btree ("offender_iin");--> statement-breakpoint
CREATE INDEX "admin_cases_org_bin_idx" ON "admin_cases" USING btree ("org_bin");--> statement-breakpoint
CREATE INDEX "admin_cases_penalty_type_idx" ON "admin_cases" USING btree ("penalty_type");--> statement-breakpoint
CREATE INDEX "admin_cases_resolution_date_idx" ON "admin_cases" USING btree ("resolution_date");--> statement-breakpoint
CREATE INDEX "admin_cases_fine_paid_voluntary_idx" ON "admin_cases" USING btree ("fine_paid_voluntary");--> statement-breakpoint
CREATE INDEX "admin_cases_fine_paid_reduced_idx" ON "admin_cases" USING btree ("fine_paid_reduced");--> statement-breakpoint
CREATE INDEX "admin_cases_fine_paid_forced_idx" ON "admin_cases" USING btree ("fine_paid_forced");--> statement-breakpoint
CREATE INDEX "control_objects_org_unit_id_idx" ON "control_objects" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "control_objects_region_idx" ON "control_objects" USING btree ("region");--> statement-breakpoint
CREATE INDEX "control_objects_status_idx" ON "control_objects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "control_objects_organization_bin_idx" ON "control_objects" USING btree ("organization_bin");--> statement-breakpoint
CREATE INDEX "incidents_org_unit_id_idx" ON "incidents" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "inspections_region_idx" ON "inspections" USING btree ("region");--> statement-breakpoint
CREATE INDEX "inspections_district_idx" ON "inspections" USING btree ("district");--> statement-breakpoint
CREATE INDEX "inspections_date_idx" ON "inspections" USING btree ("inspection_date");--> statement-breakpoint
CREATE INDEX "inspections_status_idx" ON "inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inspections_bin_idx" ON "inspections" USING btree ("bin");--> statement-breakpoint
CREATE INDEX "inspections_iin_idx" ON "inspections" USING btree ("iin");--> statement-breakpoint
CREATE INDEX "inspections_number_idx" ON "inspections" USING btree ("number");--> statement-breakpoint
CREATE INDEX "inspections_control_object_id_idx" ON "inspections" USING btree ("control_object_id");--> statement-breakpoint
CREATE INDEX "inspections_organization_bin_idx" ON "inspections" USING btree ("organization_bin");--> statement-breakpoint
CREATE INDEX "inspections_inspection_basis_idx" ON "inspections" USING btree ("inspection_basis");--> statement-breakpoint
CREATE INDEX "inspections_parent_inspection_id_idx" ON "inspections" USING btree ("parent_inspection_id");--> statement-breakpoint
CREATE INDEX "measures_related_inspection_id_idx" ON "measures" USING btree ("related_inspection_id");--> statement-breakpoint
CREATE INDEX "measures_region_idx" ON "measures" USING btree ("region");--> statement-breakpoint
CREATE INDEX "measures_district_idx" ON "measures" USING btree ("district");--> statement-breakpoint
CREATE INDEX "measures_date_idx" ON "measures" USING btree ("measure_date");--> statement-breakpoint
CREATE INDEX "measures_status_idx" ON "measures" USING btree ("status");--> statement-breakpoint
CREATE INDEX "measures_bin_idx" ON "measures" USING btree ("bin");--> statement-breakpoint
CREATE INDEX "measures_iin_idx" ON "measures" USING btree ("iin");--> statement-breakpoint
CREATE INDEX "measures_number_idx" ON "measures" USING btree ("number");--> statement-breakpoint
CREATE INDEX "measures_parent_measure_id_idx" ON "measures" USING btree ("parent_measure_id");--> statement-breakpoint
CREATE INDEX "measures_opened_at_idx" ON "measures" USING btree ("opened_at");--> statement-breakpoint
CREATE INDEX "measures_due_date_idx" ON "measures" USING btree ("due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "org_units_type_name_parent_id_key" ON "org_units" USING btree ("type","name","parent_id");--> statement-breakpoint
CREATE INDEX "org_units_type_idx" ON "org_units" USING btree ("type");--> statement-breakpoint
CREATE INDEX "org_units_parent_id_idx" ON "org_units" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "org_units_region_name_idx" ON "org_units" USING btree ("region_name");--> statement-breakpoint
CREATE INDEX "organizations_registry_bin_idx" ON "organizations_registry" USING btree ("bin");--> statement-breakpoint
CREATE INDEX "organizations_registry_type_idx" ON "organizations_registry" USING btree ("type");--> statement-breakpoint
CREATE INDEX "packages_org_unit_id_idx" ON "packages" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "prescriptions_inspection_id_idx" ON "prescriptions" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "prescriptions_region_idx" ON "prescriptions" USING btree ("region");--> statement-breakpoint
CREATE INDEX "prescriptions_district_idx" ON "prescriptions" USING btree ("district");--> statement-breakpoint
CREATE INDEX "prescriptions_issue_date_idx" ON "prescriptions" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "prescriptions_status_idx" ON "prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prescriptions_bin_idx" ON "prescriptions" USING btree ("bin");--> statement-breakpoint
CREATE INDEX "prescriptions_iin_idx" ON "prescriptions" USING btree ("iin");--> statement-breakpoint
CREATE INDEX "prescriptions_number_idx" ON "prescriptions" USING btree ("number");--> statement-breakpoint
CREATE INDEX "report_forms_org_unit_id_idx" ON "report_forms" USING btree ("org_unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_forms_org_period_form_key" ON "report_forms" USING btree ("org_unit_id","period","form");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "document_tags_org_unit_id_idx" ON "document_tags" USING btree ("org_unit_id");--> statement-breakpoint
CREATE INDEX "documents_org_unit_id_idx" ON "documents" USING btree ("org_unit_id");