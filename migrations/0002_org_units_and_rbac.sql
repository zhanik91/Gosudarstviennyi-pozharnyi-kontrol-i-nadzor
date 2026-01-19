-- Update organization structure and RBAC scope

-- Rename organizations table to org_units
ALTER TABLE IF EXISTS organizations RENAME TO org_units;

-- Add org unit fields
ALTER TABLE org_units
  ADD COLUMN IF NOT EXISTS region_name varchar,
  ADD COLUMN IF NOT EXISTS unit_name varchar;

-- Ensure parent relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_units_parent_id_fkey'
  ) THEN
    ALTER TABLE org_units
      ADD CONSTRAINT org_units_parent_id_fkey
      FOREIGN KEY (parent_id)
      REFERENCES org_units(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Update organization type enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
    ALTER TYPE organization_type RENAME TO organization_type_old;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_unit_type') THEN
    CREATE TYPE org_unit_type AS ENUM ('MCHS', 'DCHS', 'DISTRICT');
  END IF;
END $$;

ALTER TABLE org_units
  ALTER COLUMN type TYPE org_unit_type
  USING CASE type
    WHEN 'rk' THEN 'MCHS'
    WHEN 'region' THEN 'DCHS'
    WHEN 'district' THEN 'DISTRICT'
    ELSE 'DISTRICT'
  END;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type_old') THEN
    DROP TYPE organization_type_old;
  END IF;
END $$;

-- Update user roles enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE user_role RENAME TO user_role_old;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('MCHS', 'DCHS', 'DISTRICT');
  END IF;
END $$;

ALTER TABLE users
  ALTER COLUMN role TYPE user_role
  USING CASE role
    WHEN 'admin' THEN 'MCHS'
    WHEN 'reviewer' THEN 'DCHS'
    WHEN 'approver' THEN 'DCHS'
    WHEN 'editor' THEN 'DISTRICT'
    ELSE 'DISTRICT'
  END;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_old') THEN
    DROP TYPE user_role_old;
  END IF;
END $$;

-- Rename columns for org units and password
ALTER TABLE users RENAME COLUMN IF EXISTS password TO password_hash;
ALTER TABLE users RENAME COLUMN IF EXISTS organization_id TO org_unit_id;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_on_first_login boolean DEFAULT true;

ALTER TABLE incidents RENAME COLUMN IF EXISTS organization_id TO org_unit_id;
ALTER TABLE packages RENAME COLUMN IF EXISTS organization_id TO org_unit_id;
ALTER TABLE documents RENAME COLUMN IF EXISTS organization_id TO org_unit_id;
ALTER TABLE document_tags RENAME COLUMN IF EXISTS organization_id TO org_unit_id;

-- Foreign keys for org units
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_org_unit_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_org_unit_id_fkey
      FOREIGN KEY (org_unit_id)
      REFERENCES org_units(id)
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'incidents_org_unit_id_fkey'
  ) THEN
    ALTER TABLE incidents
      ADD CONSTRAINT incidents_org_unit_id_fkey
      FOREIGN KEY (org_unit_id)
      REFERENCES org_units(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'packages_org_unit_id_fkey'
  ) THEN
    ALTER TABLE packages
      ADD CONSTRAINT packages_org_unit_id_fkey
      FOREIGN KEY (org_unit_id)
      REFERENCES org_units(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_org_unit_id_fkey'
  ) THEN
    ALTER TABLE documents
      ADD CONSTRAINT documents_org_unit_id_fkey
      FOREIGN KEY (org_unit_id)
      REFERENCES org_units(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'document_tags_org_unit_id_fkey'
  ) THEN
    ALTER TABLE document_tags
      ADD CONSTRAINT document_tags_org_unit_id_fkey
      FOREIGN KEY (org_unit_id)
      REFERENCES org_units(id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Indexes for scope filtering
CREATE UNIQUE INDEX IF NOT EXISTS org_units_type_name_parent_id_key
  ON org_units (type, name, parent_id);
CREATE INDEX IF NOT EXISTS org_units_type_idx ON org_units (type);
CREATE INDEX IF NOT EXISTS org_units_parent_id_idx ON org_units (parent_id);
CREATE INDEX IF NOT EXISTS org_units_region_name_idx ON org_units (region_name);

CREATE INDEX IF NOT EXISTS incidents_org_unit_id_idx ON incidents (org_unit_id);
CREATE INDEX IF NOT EXISTS packages_org_unit_id_idx ON packages (org_unit_id);
CREATE INDEX IF NOT EXISTS documents_org_unit_id_idx ON documents (org_unit_id);
