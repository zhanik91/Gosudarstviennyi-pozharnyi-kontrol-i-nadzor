DO $$ BEGIN
  CREATE TYPE "admin_case_payment_type" AS ENUM ('voluntary', 'forced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "admin_case_outcome" AS ENUM ('warning', 'termination', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "admin_cases"
  ADD COLUMN IF NOT EXISTS "fine_amount" numeric(15, 2) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS "payment_type" "admin_case_payment_type",
  ADD COLUMN IF NOT EXISTS "outcome" "admin_case_outcome" DEFAULT 'other';
