// Дополнительные определения схемы для формы 13-КПС
// Этот файл содержит новые таблицы и расширения существующих таблиц
// Импортировать в schema.ts

import { sql } from 'drizzle-orm';
import {
    index,
    pgTable,
    timestamp,
    varchar,
    text,
    boolean,
} from "drizzle-orm/pg-core";
import { organizationTypeEnum, inspectionBasisEnum } from './schema';
import { controlObjects, inspections, measures } from './schema';

// Organizations Registry (Реестр организаций) для формы 13-КПС  
export const organizationsRegistry = pgTable("organizations_registry", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    bin: varchar("bin").notNull().unique(), // БИН организации
    iin: varchar("iin"), // ИИН для ИП
    name: varchar("name").notNull(),
    type: organizationTypeEnum("type").notNull(),
    isGovernment: boolean("is_government").notNull().default(false), // Государственная или нет

    // Дополнительные данные
    region: varchar("region"),
    district: varchar("district"),
    address: text("address"),

    // Автоматическое определение из внешних источников
    autoDetected: boolean("auto_detected").default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
    index("organizations_registry_bin_idx").on(table.bin),
    index("organizations_registry_type_idx").on(table.type),
]);

// ПРИМЕЧАНИЕ: Следующие изменения нужно внести в schema.ts вручную:

/*
1. Обновить inspections таблицу - добавить поля:
  
  controlObjectId: varchar("control_object_id").references(() => controlObjects.id),
  organizationBin: varchar("organization_bin").references(() => organizationsRegistry.bin),
  inspectionBasis: inspectionBasisEnum("inspection_basis").default('plan'),
  riskLevel: varchar("risk_level", { enum: ["low", "medium", "high"] }),
  parentInspectionId: varchar("parent_inspection_id").references(() => inspections.id),
  isFollowUpInspection: boolean("is_follow_up_inspection").default(false),
  adminResponsibilityApplied: boolean("admin_responsibility_applied").default(false),

И индексы:
  index("inspections_control_object_id_idx").on(table.controlObjectId),
  index("inspections_organization_bin_idx").on(table.organizationBin),
  index("inspections_inspection_basis_idx").on(table.inspectionBasis),
  index("inspections_parent_inspection_id_idx").on(table.parentInspectionId),

2. Обновить measures таблицу - добавить поля:

  parentMeasureId: varchar("parent_measure_id").references(() => measures.id),
  isRepeat: boolean("is_repeat").default(false),
  openedAt: timestamp("opened_at").notNull(),
  dueDate: timestamp("due_date"),
  closedAt: timestamp("closed_at"),
  followUpInspectionId: varchar("follow_up_inspection_id").references(() => inspections.id),

И индексы:
  index("measures_parent_measure_id_idx").on(table.parentMeasureId),
  index("measures_opened_at_idx").on(table.openedAt),
  index("measures_due_date_idx").on(table.dueDate),

3. Обновить control_objects таблицу - добавить поле:

  organizationBin: varchar("organization_bin").references(() => organizationsRegistry.bin),

И индекс:
  index("control_objects_organization_bin_idx").on(table.organizationBin),

4. Обновить users таблицу - добавить поле:
  
  isInspector: boolean("is_inspector").default(false),

5. Исправить дубликат в adminCases:
   Удалить строку 450: fineAmount: decimal("fine_amount", { precision: 15, scale: 2 }).default('0'),
   Оставить только строку 468: fineAmount: decimal("fine_amount", { precision: 15, scale: 2 }),
*/
