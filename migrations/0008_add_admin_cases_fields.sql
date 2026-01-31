ALTER TABLE "admin_cases"
  ADD COLUMN IF NOT EXISTS "protocol_number" varchar,
  ADD COLUMN IF NOT EXISTS "protocol_date" timestamp,
  ADD COLUMN IF NOT EXISTS "offender_name" varchar,
  ADD COLUMN IF NOT EXISTS "offender_birth_date" timestamp,
  ADD COLUMN IF NOT EXISTS "offender_iin" varchar,
  ADD COLUMN IF NOT EXISTS "org_name" varchar,
  ADD COLUMN IF NOT EXISTS "org_bin" varchar,
  ADD COLUMN IF NOT EXISTS "inspector_name" varchar,
  ADD COLUMN IF NOT EXISTS "penalty_type" varchar,
  ADD COLUMN IF NOT EXISTS "resolution_date" timestamp,
  ADD COLUMN IF NOT EXISTS "fine_amount" numeric(15, 2),
  ADD COLUMN IF NOT EXISTS "fine_paid_voluntary" boolean,
  ADD COLUMN IF NOT EXISTS "fine_paid_reduced" boolean,
  ADD COLUMN IF NOT EXISTS "fine_paid_forced" boolean,
  ADD COLUMN IF NOT EXISTS "termination_reason" text,
  ADD COLUMN IF NOT EXISTS "termination_date" timestamp,
  ADD COLUMN IF NOT EXISTS "appeal_result" text,
  ADD COLUMN IF NOT EXISTS "appeal_decision_date" timestamp,
  ADD COLUMN IF NOT EXISTS "transfer_to" varchar,
  ADD COLUMN IF NOT EXISTS "transfer_type" varchar,
  ADD COLUMN IF NOT EXISTS "enforcement_sent" boolean,
  ADD COLUMN IF NOT EXISTS "offender_contact" text;

CREATE INDEX IF NOT EXISTS "admin_cases_article_idx" ON "admin_cases" ("article");
CREATE INDEX IF NOT EXISTS "admin_cases_protocol_number_idx" ON "admin_cases" ("protocol_number");
CREATE INDEX IF NOT EXISTS "admin_cases_protocol_date_idx" ON "admin_cases" ("protocol_date");
CREATE INDEX IF NOT EXISTS "admin_cases_offender_iin_idx" ON "admin_cases" ("offender_iin");
CREATE INDEX IF NOT EXISTS "admin_cases_org_bin_idx" ON "admin_cases" ("org_bin");
CREATE INDEX IF NOT EXISTS "admin_cases_penalty_type_idx" ON "admin_cases" ("penalty_type");
CREATE INDEX IF NOT EXISTS "admin_cases_resolution_date_idx" ON "admin_cases" ("resolution_date");
CREATE INDEX IF NOT EXISTS "admin_cases_fine_paid_voluntary_idx" ON "admin_cases" ("fine_paid_voluntary");
CREATE INDEX IF NOT EXISTS "admin_cases_fine_paid_reduced_idx" ON "admin_cases" ("fine_paid_reduced");
CREATE INDEX IF NOT EXISTS "admin_cases_fine_paid_forced_idx" ON "admin_cases" ("fine_paid_forced");
