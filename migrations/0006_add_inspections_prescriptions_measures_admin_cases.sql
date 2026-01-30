DO $$ BEGIN
  CREATE TYPE "inspection_type" AS ENUM ('scheduled', 'unscheduled', 'preventive', 'monitoring');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "inspection_status" AS ENUM ('planned', 'in_progress', 'completed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "prescription_status" AS ENUM ('issued', 'in_progress', 'fulfilled', 'overdue', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "measure_type" AS ENUM ('warning', 'order', 'fine', 'suspension', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "measure_status" AS ENUM ('draft', 'issued', 'in_progress', 'completed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "admin_case_status" AS ENUM ('opened', 'in_review', 'resolved', 'closed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "inspections" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "number" varchar NOT NULL,
  "inspection_date" timestamp NOT NULL,
  "type" "inspection_type" NOT NULL,
  "status" "inspection_status" NOT NULL DEFAULT 'planned',
  "region" varchar,
  "district" varchar,
  "bin" varchar,
  "iin" varchar,
  "subject_name" varchar,
  "address" text,
  "org_unit_id" varchar,
  "created_by" varchar,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "prescriptions" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "inspection_id" varchar NOT NULL REFERENCES "inspections"("id"),
  "number" varchar NOT NULL,
  "issue_date" timestamp NOT NULL,
  "due_date" timestamp,
  "status" "prescription_status" NOT NULL DEFAULT 'issued',
  "region" varchar,
  "district" varchar,
  "bin" varchar,
  "iin" varchar,
  "description" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "measures" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "related_inspection_id" varchar REFERENCES "inspections"("id"),
  "number" varchar NOT NULL,
  "measure_date" timestamp NOT NULL,
  "type" "measure_type" NOT NULL,
  "status" "measure_status" NOT NULL DEFAULT 'draft',
  "region" varchar,
  "district" varchar,
  "bin" varchar,
  "iin" varchar,
  "description" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "admin_cases" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "inspection_id" varchar REFERENCES "inspections"("id"),
  "number" varchar NOT NULL,
  "case_date" timestamp NOT NULL,
  "status" "admin_case_status" NOT NULL DEFAULT 'opened',
  "region" varchar,
  "district" varchar,
  "bin" varchar,
  "iin" varchar,
  "article" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "inspections_region_idx" ON "inspections" ("region");
CREATE INDEX IF NOT EXISTS "inspections_district_idx" ON "inspections" ("district");
CREATE INDEX IF NOT EXISTS "inspections_date_idx" ON "inspections" ("inspection_date");
CREATE INDEX IF NOT EXISTS "inspections_status_idx" ON "inspections" ("status");
CREATE INDEX IF NOT EXISTS "inspections_bin_idx" ON "inspections" ("bin");
CREATE INDEX IF NOT EXISTS "inspections_iin_idx" ON "inspections" ("iin");
CREATE INDEX IF NOT EXISTS "inspections_number_idx" ON "inspections" ("number");

CREATE INDEX IF NOT EXISTS "prescriptions_inspection_id_idx" ON "prescriptions" ("inspection_id");
CREATE INDEX IF NOT EXISTS "prescriptions_region_idx" ON "prescriptions" ("region");
CREATE INDEX IF NOT EXISTS "prescriptions_district_idx" ON "prescriptions" ("district");
CREATE INDEX IF NOT EXISTS "prescriptions_issue_date_idx" ON "prescriptions" ("issue_date");
CREATE INDEX IF NOT EXISTS "prescriptions_status_idx" ON "prescriptions" ("status");
CREATE INDEX IF NOT EXISTS "prescriptions_bin_idx" ON "prescriptions" ("bin");
CREATE INDEX IF NOT EXISTS "prescriptions_iin_idx" ON "prescriptions" ("iin");
CREATE INDEX IF NOT EXISTS "prescriptions_number_idx" ON "prescriptions" ("number");

CREATE INDEX IF NOT EXISTS "measures_related_inspection_id_idx" ON "measures" ("related_inspection_id");
CREATE INDEX IF NOT EXISTS "measures_region_idx" ON "measures" ("region");
CREATE INDEX IF NOT EXISTS "measures_district_idx" ON "measures" ("district");
CREATE INDEX IF NOT EXISTS "measures_date_idx" ON "measures" ("measure_date");
CREATE INDEX IF NOT EXISTS "measures_status_idx" ON "measures" ("status");
CREATE INDEX IF NOT EXISTS "measures_bin_idx" ON "measures" ("bin");
CREATE INDEX IF NOT EXISTS "measures_iin_idx" ON "measures" ("iin");
CREATE INDEX IF NOT EXISTS "measures_number_idx" ON "measures" ("number");

CREATE INDEX IF NOT EXISTS "admin_cases_inspection_id_idx" ON "admin_cases" ("inspection_id");
CREATE INDEX IF NOT EXISTS "admin_cases_region_idx" ON "admin_cases" ("region");
CREATE INDEX IF NOT EXISTS "admin_cases_district_idx" ON "admin_cases" ("district");
CREATE INDEX IF NOT EXISTS "admin_cases_date_idx" ON "admin_cases" ("case_date");
CREATE INDEX IF NOT EXISTS "admin_cases_status_idx" ON "admin_cases" ("status");
CREATE INDEX IF NOT EXISTS "admin_cases_bin_idx" ON "admin_cases" ("bin");
CREATE INDEX IF NOT EXISTS "admin_cases_iin_idx" ON "admin_cases" ("iin");
CREATE INDEX IF NOT EXISTS "admin_cases_number_idx" ON "admin_cases" ("number");
