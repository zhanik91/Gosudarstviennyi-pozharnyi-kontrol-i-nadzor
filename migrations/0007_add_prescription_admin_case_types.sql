DO $$ BEGIN
  CREATE TYPE "prescription_type" AS ENUM ('primary', 'repeat', 'follow_up', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "admin_case_type" AS ENUM ('protocol', 'resolution', 'appeal', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "prescriptions"
  ADD COLUMN IF NOT EXISTS "type" "prescription_type" NOT NULL DEFAULT 'primary';

ALTER TABLE "admin_cases"
  ADD COLUMN IF NOT EXISTS "type" "admin_case_type" NOT NULL DEFAULT 'protocol';
