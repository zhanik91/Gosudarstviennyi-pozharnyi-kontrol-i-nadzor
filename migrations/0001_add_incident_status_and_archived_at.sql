ALTER TABLE "incidents"
  ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'pending';

ALTER TABLE "incidents"
  ADD COLUMN IF NOT EXISTS "archived_at" timestamp;
