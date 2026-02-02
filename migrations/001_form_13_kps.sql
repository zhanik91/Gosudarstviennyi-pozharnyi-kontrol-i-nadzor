-- Migration for Form 13-KPS
-- Добавление новых enums, таблиц и полей для формы 13-КПС

-- 1. Создание новых enums
CREATE TYPE organization_type AS ENUM (
  'government',
  'small_business',
  'medium_business',
  'large_business',
  'individual'
);

CREATE TYPE inspection_basis AS ENUM (
  'plan',
  'prescription',
  'prosecutor',
  'complaint',
  'pnsem',
  'fire_incident',
  'other'
);

-- 2. Обновление inspection_type enum (добавление preventive_control)
ALTER TYPE inspection_type ADD VALUE IF NOT EXISTS 'preventive_control';

-- 3. Создание таблицы реестра организаций
CREATE TABLE organizations_registry (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  bin VARCHAR NOT NULL UNIQUE,
  iin VARCHAR,
  name VARCHAR NOT NULL,
  type organization_type NOT NULL,
  is_government BOOLEAN NOT NULL DEFAULT FALSE,
  region VARCHAR,
  district VARCHAR,
  address TEXT,
  auto_detected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX organizations_registry_bin_idx ON organizations_registry(bin);
CREATE INDEX organizations_registry_type_idx ON organizations_registry(type);

-- 4. Добавление полей в inspections
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS control_object_id VARCHAR REFERENCES control_objects(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS organization_bin VARCHAR REFERENCES organizations_registry(bin);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_basis inspection_basis DEFAULT 'plan';
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS risk_level VARCHAR CHECK (risk_level IN ('low', 'medium', 'high'));
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS parent_inspection_id VARCHAR REFERENCES inspections(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS is_follow_up_inspection BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS admin_responsibility_applied BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS inspections_control_object_id_idx ON inspections(control_object_id);
CREATE INDEX IF NOT EXISTS inspections_organization_bin_idx ON inspections(organization_bin);
CREATE INDEX IF NOT EXISTS inspections_inspection_basis_idx ON inspections(inspection_basis);
CREATE INDEX IF NOT EXISTS inspections_parent_inspection_id_idx ON inspections(parent_inspection_id);

-- 5. Добавление полей в measures
ALTER TABLE measures ADD COLUMN IF NOT EXISTS parent_measure_id VARCHAR REFERENCES measures(id);
ALTER TABLE measures ADD COLUMN IF NOT EXISTS is_repeat BOOLEAN DEFAULT FALSE;
ALTER TABLE measures ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP;
ALTER TABLE measures ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE measures ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
ALTER TABLE measures ADD COLUMN IF NOT EXISTS follow_up_inspection_id VARCHAR REFERENCES inspections(id);

CREATE INDEX IF NOT EXISTS measures_parent_measure_id_idx ON measures(parent_measure_id);
CREATE INDEX IF NOT EXISTS measures_opened_at_idx ON measures(opened_at);
CREATE INDEX IF NOT EXISTS measures_due_date_idx ON measures(due_date);

-- 6. Добавление полей в control_objects
ALTER TABLE control_objects ADD COLUMN IF NOT EXISTS organization_bin VARCHAR REFERENCES organizations_registry(bin);

CREATE INDEX IF NOT EXISTS control_objects_organization_bin_idx ON control_objects(organization_bin);

-- 7. Добавление полей в users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_inspector BOOLEAN DEFAULT FALSE;

COMMENT ON TABLE organizations_registry IS 'Реестр организаций для формы 13-КПС с типами и степенями риска';
COMMENT ON COLUMN inspections.inspection_basis IS 'Основание проверки: план, прокуратура, жалобы, ПНСЕМ и т.д.';
COMMENT ON COLUMN inspections.admin_responsibility_applied IS 'Применена ли административная ответственность (не применяется при профилактическом контроле)';
COMMENT ON COLUMN measures.is_repeat IS 'Повторный МОР (применяется при контрольной проверке)';
