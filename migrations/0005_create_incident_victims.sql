CREATE TABLE IF NOT EXISTS "incident_victims" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "incident_id" varchar NOT NULL REFERENCES "incidents"("id"),
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

CREATE INDEX IF NOT EXISTS "incident_victims_incident_id_idx" ON "incident_victims" ("incident_id");
