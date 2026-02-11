import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  text,
  decimal,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { normalizeTimeOfDayBucket, TIME_OF_DAY_BUCKETS } from "./time-of-day";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'MCHS', 'DCHS', 'OCHS', 'DISTRICT']);

// Organization types enum
export const orgUnitTypeEnum = pgEnum('org_unit_type', ['MCHS', 'DCHS', 'DISTRICT']);

// Incident types enum
export const incidentTypeEnum = pgEnum('incident_type', [
  'fire', 'nonfire', 'steppe_fire', 'steppe_smolder', 'co_nofire'
]);

// Package status enum
export const packageStatusEnum = pgEnum('package_status', [
  'draft', 'submitted', 'under_review', 'approved', 'rejected'
]);

export const reportFormStatusEnum = pgEnum('report_form_status', [
  'draft', 'submitted'
]);

export const inspectionTypeEnum = pgEnum('inspection_type', [
  'scheduled', 'unscheduled', 'preventive_control', 'monitoring'
]);

export const inspectionStatusEnum = pgEnum('inspection_status', [
  'planned', 'in_progress', 'completed', 'canceled'
]);

export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'issued', 'in_progress', 'fulfilled', 'overdue', 'canceled'
]);

export const prescriptionTypeEnum = pgEnum('prescription_type', [
  'primary', 'repeat', 'follow_up', 'other'
]);

export const measureTypeEnum = pgEnum('measure_type', [
  'warning', 'order', 'fine', 'suspension', 'other'
]);

export const measureStatusEnum = pgEnum('measure_status', [
  'draft', 'issued', 'in_progress', 'completed', 'canceled'
]);

export const adminCaseStatusEnum = pgEnum('admin_case_status', [
  'opened', 'in_review', 'resolved', 'closed', 'canceled'
]);

export const adminCaseTypeEnum = pgEnum('admin_case_type', [
  'protocol', 'resolution', 'appeal', 'other'
]);

export const adminCasePaymentTypeEnum = pgEnum('admin_case_payment_type', [
  'voluntary', 'forced'
]);

export const adminCaseOutcomeEnum = pgEnum('admin_case_outcome', [
  'warning', 'termination', 'other'
]);

// Organization types enum (для формы 13-КПС)
export const organizationTypeEnum = pgEnum('organization_type', [
  'government',        // Государственная
  'small_business',    // Малый бизнес
  'medium_business',   // Средний бизнес
  'large_business',    // Крупный бизнес
  'individual'         // Физическое лицо
]);

// Inspection basis enum (основание проверки для формы 13-КПС)
export const inspectionBasisEnum = pgEnum('inspection_basis', [
  'plan',              // По плану
  'prescription',      // По контролю исполнения предписаний
  'prosecutor',        // По поручению прокуратуры
  'complaint',         // По жалобам (обращения физ/юр лиц)
  'pnsem',            // По письмам (ПНСЕМ - ст.152 ПК РК)
  'fire_incident',    // По факту пожара
  'other'
]);

// Users table for local authentication (МЧС РК)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  fullName: varchar("full_name").default(""),
  region: varchar("region").default(""),
  district: varchar("district").default(""),
  email: text("email").notNull().default(""),
  role: userRoleEnum("role").notNull().default('DISTRICT'),
  orgUnitId: varchar("org_unit_id"),
  mustChangeOnFirstLogin: boolean("must_change_on_first_login").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  isInspector: boolean("is_inspector").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table
export const orgUnits = pgTable("org_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: orgUnitTypeEnum("type").notNull(),
  name: varchar("name").notNull(),
  parentId: varchar("parent_id"),
  regionName: varchar("region_name").default(""),
  unitName: varchar("unit_name").default(""),
  code: varchar("code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ([
  uniqueIndex("org_units_type_name_parent_id_key").on(table.type, table.name, table.parentId),
  index("org_units_type_idx").on(table.type),
  index("org_units_parent_id_idx").on(table.parentId),
  index("org_units_region_name_idx").on(table.regionName),
]));

// Organizations Registry (Реестр организаций для формы 13-КПС)
export const organizationsRegistry = pgTable("organizations_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bin: varchar("bin").notNull().unique(),
  iin: varchar("iin"),
  name: varchar("name").notNull(),
  type: organizationTypeEnum("type").notNull(),
  isGovernment: boolean("is_government").notNull().default(false),
  region: varchar("region"),
  district: varchar("district"),
  address: text("address"),
  autoDetected: boolean("auto_detected").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("organizations_registry_bin_idx").on(table.bin),
  index("organizations_registry_type_idx").on(table.type),
]);

// Fire incidents table (согласно форме 1-ОСП)
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Основная информация
  dateTime: timestamp("date_time").notNull(),
  locality: varchar("locality").notNull(), // cities, rural
  incidentType: incidentTypeEnum("incident_type").notNull(),

  // Адрес и описание
  address: text("address").notNull(),
  description: text("description"),

  // Причина пожара (согласно форме 3-СПВП)
  cause: varchar("cause"),
  causeCode: varchar("cause_code"), // Код причины согласно классификации МЧС РК
  causeDetailed: varchar("cause_detailed"), // Детальный код причины (6.1, 6.2 и т.д.)

  // Объект пожара (согласно форме 4-СОВП) 
  objectType: varchar("object_type"), // Тип объекта (жилой, производственный и т.д.)
  objectCode: varchar("object_code"), // Код объекта
  objectDetailed: varchar("object_detailed"), // Детальный код объекта

  // Географические данные РК
  region: varchar("region"), // Область
  district: varchar("district"), // Район
  city: varchar("city"), // Город/район (legacy)

  // Ущерб (тысячи тенге)
  damage: decimal("damage", { precision: 15, scale: 2 }).default('0'),

  // Степные пожары (Форма 6-ССПЗ)
  steppeArea: decimal("steppe_area", { precision: 15, scale: 2 }).default('0'),
  steppeDamage: decimal("steppe_damage", { precision: 15, scale: 2 }).default('0'),
  steppePeopleTotal: integer("steppe_people_total").default(0),
  steppePeopleDead: integer("steppe_people_dead").default(0),
  steppePeopleInjured: integer("steppe_people_injured").default(0),
  steppeAnimalsTotal: integer("steppe_animals_total").default(0),
  steppeAnimalsDead: integer("steppe_animals_dead").default(0),
  steppeAnimalsInjured: integer("steppe_animals_injured").default(0),
  steppeExtinguishedTotal: integer("steppe_extinguished_total").default(0),
  steppeExtinguishedArea: decimal("steppe_extinguished_area", { precision: 15, scale: 2 }).default('0'),
  steppeExtinguishedDamage: decimal("steppe_extinguished_damage", { precision: 15, scale: 2 }).default('0'),
  steppeGarrisonPeople: integer("steppe_garrison_people").default(0),
  steppeGarrisonUnits: integer("steppe_garrison_units").default(0),
  steppeMchsPeople: integer("steppe_mchs_people").default(0),
  steppeMchsUnits: integer("steppe_mchs_units").default(0),

  // Детали здания
  floor: integer("floor"),
  totalFloors: integer("total_floors"),
  buildingDetails: jsonb("building_details"), // Доп. детали строения

  // Детальная статистика по потерям (Form 5)
  livestockLost: jsonb("livestock_lost"), // { cows: 5, sheep: 2, ... }
  destroyedItems: jsonb("destroyed_items"), // { techniques: 1, structures: 1 }

  // Погибшие на пожарах
  deathsTotal: integer("deaths_total").default(0),
  deathsChildren: integer("deaths_children").default(0),
  deathsDrunk: integer("deaths_drunk").default(0), // лица в нетрезвом состоянии

  // Погибшие от угарного газа без пожара
  deathsCOTotal: integer("deaths_co_total").default(0),
  deathsCOChildren: integer("deaths_co_children").default(0),

  // Травмированные на пожарах
  injuredTotal: integer("injured_total").default(0),
  injuredChildren: integer("injured_children").default(0),

  // Травмированные от угарного газа без пожара
  injuredCOTotal: integer("injured_co_total").default(0),
  injuredCOChildren: integer("injured_co_children").default(0),

  // Спасенные люди
  savedPeopleTotal: integer("saved_people_total").default(0),
  savedPeopleChildren: integer("saved_people_children").default(0),

  // Спасенные материальные ценности (тысячи тенге)
  savedProperty: decimal("saved_property", { precision: 15, scale: 2 }).default('0'),

  // Система управления
  orgUnitId: varchar("org_unit_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  packageId: varchar("package_id"),
  status: varchar("status", { enum: ["pending", "investigating", "resolved", "archived"] })
    .notNull()
    .default("pending"),
  archivedAt: timestamp("archived_at"),

  // Метки времени
  timeOfDay: varchar("time_of_day"), // 00:00-06:00, etc. (Can be derived but useful for explicit Form 5/7 stats)

  // Геолокация для карты
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("incidents_org_unit_id_idx").on(table.orgUnitId),
  index("incidents_date_time_idx").on(table.dateTime),
  index("incidents_incident_type_idx").on(table.incidentType),
  index("incidents_region_idx").on(table.region),
]);

// Detailed victims table for Forms 5 and 7
export const incidentVictims = pgTable("incident_victims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  incidentId: varchar("incident_id").notNull(),

  // Personal Info (Anonimized if needed)
  fullName: varchar("full_name"),
  gender: varchar("gender", { enum: ["male", "female"] }).notNull(),
  ageGroup: varchar("age_group").notNull(), // child, adult, pensioner
  age: integer("age"),

  // Status and Type
  status: varchar("status", { enum: ["dead", "injured", "saved"] }).notNull(),
  victimType: varchar("victim_type", { enum: ["fire", "co_poisoning"] }).notNull(), // Fire (Form 5) or CO (Form 7)

  // Details for Forms
  socialStatus: varchar("social_status"), // worker, employee, pensioner, etc.
  deathCause: varchar("death_cause"), // high_temp, smoke, collapse, etc.
  deathPlace: varchar("death_place"), // on_site, hospital, en_route
  condition: varchar("condition"), // alcohol, sleep, disability, etc.

  createdAt: timestamp("created_at").defaultNow(),
});

// Packages table for workflow
export const packages = pgTable("packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  period: varchar("period").notNull(), // YYYY-MM format
  orgUnitId: varchar("org_unit_id").notNull(),
  status: packageStatusEnum("status").notNull().default('draft'),
  submittedBy: varchar("submitted_by"),
  submittedAt: timestamp("submitted_at"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("packages_org_unit_id_idx").on(table.orgUnitId),
]);

export const reportForms = pgTable("report_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgUnitId: varchar("org_unit_id").notNull(),
  period: varchar("period").notNull(),
  form: varchar("form").notNull(),
  data: jsonb("data").notNull(),
  status: reportFormStatusEnum("status").notNull().default('draft'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("report_forms_org_unit_id_idx").on(table.orgUnitId),
  uniqueIndex("report_forms_org_period_form_key").on(table.orgUnitId, table.period, table.form),
]);

// Объекты контроля для карты
export const controlObjectStatusEnum = pgEnum('control_object_status', [
  'active', 'inactive', 'under_inspection', 'violation', 'closed'
]);

export const controlObjects = pgTable("control_objects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Основная информация
  name: varchar("name").notNull(),
  category: varchar("category").notNull(), // Категория объекта (жилой, производственный и т.д.)
  subcategory: varchar("subcategory"),

  // Адрес и геолокация
  address: text("address").notNull(),
  region: varchar("region"),
  district: varchar("district"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),

  // Статус и характеристики
  status: controlObjectStatusEnum("status").notNull().default('active'),
  riskLevel: varchar("risk_level", { enum: ["low", "medium", "high", "critical"] }).default('medium'),
  lastInspectionDate: timestamp("last_inspection_date"),
  nextInspectionDate: timestamp("next_inspection_date"),

  // Дополнительные данные
  description: text("description"),
  contactPerson: varchar("contact_person"),
  contactPhone: varchar("contact_phone"),
  details: jsonb("details"),

  // Связь с реестром организаций (Форма 13-КПС)
  organizationBin: varchar("organization_bin"),

  // Система управления
  orgUnitId: varchar("org_unit_id").notNull(),
  createdBy: varchar("created_by").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("control_objects_org_unit_id_idx").on(table.orgUnitId),
  index("control_objects_region_idx").on(table.region),
  index("control_objects_status_idx").on(table.status),
  index("control_objects_organization_bin_idx").on(table.organizationBin),
]);

export const inspections = pgTable("inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  number: varchar("number").notNull(),
  inspectionDate: timestamp("inspection_date").notNull(),
  type: inspectionTypeEnum("type").notNull(),
  status: inspectionStatusEnum("status").notNull().default('planned'),
  ukpsisuCheckNumber: varchar("ukpsisu_check_number"),
  ukpsisuRegistrationDate: timestamp("ukpsisu_registration_date"),
  assigningAuthority: varchar("assigning_authority"),
  registrationAuthority: varchar("registration_authority"),
  inspectionKind: varchar("inspection_kind"),
  inspectedObjects: text("inspected_objects"),
  basis: text("basis"),
  inspectionPeriod: text("inspection_period"),
  extensionPeriod: text("extension_period"),
  suspensionResumptionDates: text("suspension_resumption_dates"),
  actualStartDate: timestamp("actual_start_date"),
  actualEndDate: timestamp("actual_end_date"),
  result: text("result"),
  violationsCount: integer("violations_count"),
  violationsDeadline: timestamp("violations_deadline"),
  ticketRegistrationDate: timestamp("ticket_registration_date"),
  region: varchar("region"),
  district: varchar("district"),
  bin: varchar("bin"),
  iin: varchar("iin"),
  subjectName: varchar("subject_name"),
  address: text("address"),
  orgUnitId: varchar("org_unit_id"),
  createdBy: varchar("created_by"),

  // Новые поля для формы 13-КПС
  controlObjectId: varchar("control_object_id"),
  organizationBin: varchar("organization_bin"),
  inspectionBasis: inspectionBasisEnum("inspection_basis").default('plan'),
  riskLevel: varchar("risk_level", { enum: ["low", "medium", "high"] }),
  parentInspectionId: varchar("parent_inspection_id"),
  isFollowUpInspection: boolean("is_follow_up_inspection").default(false),
  adminResponsibilityApplied: boolean("admin_responsibility_applied").default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("inspections_region_idx").on(table.region),
  index("inspections_district_idx").on(table.district),
  index("inspections_date_idx").on(table.inspectionDate),
  index("inspections_status_idx").on(table.status),
  index("inspections_bin_idx").on(table.bin),
  index("inspections_iin_idx").on(table.iin),
  index("inspections_number_idx").on(table.number),
  index("inspections_control_object_id_idx").on(table.controlObjectId),
  index("inspections_organization_bin_idx").on(table.organizationBin),
  index("inspections_inspection_basis_idx").on(table.inspectionBasis),
  index("inspections_parent_inspection_id_idx").on(table.parentInspectionId),
]);

export const prescriptions = pgTable("prescriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").notNull().references(() => inspections.id),
  number: varchar("number").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date"),
  type: prescriptionTypeEnum("type").notNull().default('primary'),
  status: prescriptionStatusEnum("status").notNull().default('issued'),
  region: varchar("region"),
  district: varchar("district"),
  bin: varchar("bin"),
  iin: varchar("iin"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("prescriptions_inspection_id_idx").on(table.inspectionId),
  index("prescriptions_region_idx").on(table.region),
  index("prescriptions_district_idx").on(table.district),
  index("prescriptions_issue_date_idx").on(table.issueDate),
  index("prescriptions_status_idx").on(table.status),
  index("prescriptions_bin_idx").on(table.bin),
  index("prescriptions_iin_idx").on(table.iin),
  index("prescriptions_number_idx").on(table.number),
]);

export const measures = pgTable("measures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  relatedInspectionId: varchar("related_inspection_id").references(() => inspections.id),
  number: varchar("number").notNull(),
  measureDate: timestamp("measure_date").notNull(),
  type: measureTypeEnum("type").notNull(),
  status: measureStatusEnum("status").notNull().default('draft'),
  region: varchar("region"),
  district: varchar("district"),
  bin: varchar("bin"),
  iin: varchar("iin"),
  description: text("description"),

  // Новые поля для формы 13-КПС
  parentMeasureId: varchar("parent_measure_id"),
  isRepeat: boolean("is_repeat").default(false),
  openedAt: timestamp("opened_at"),
  dueDate: timestamp("due_date"),
  closedAt: timestamp("closed_at"),
  followUpInspectionId: varchar("follow_up_inspection_id"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("measures_related_inspection_id_idx").on(table.relatedInspectionId),
  index("measures_region_idx").on(table.region),
  index("measures_district_idx").on(table.district),
  index("measures_date_idx").on(table.measureDate),
  index("measures_status_idx").on(table.status),
  index("measures_bin_idx").on(table.bin),
  index("measures_iin_idx").on(table.iin),
  index("measures_number_idx").on(table.number),
  index("measures_parent_measure_id_idx").on(table.parentMeasureId),
  index("measures_opened_at_idx").on(table.openedAt),
  index("measures_due_date_idx").on(table.dueDate),
]);

export const adminCases = pgTable("admin_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").references(() => inspections.id),
  number: varchar("number").notNull(),
  caseDate: timestamp("case_date").notNull(),
  type: adminCaseTypeEnum("type").notNull().default('protocol'),
  status: adminCaseStatusEnum("status").notNull().default('opened'),
  paymentType: adminCasePaymentTypeEnum("payment_type"),
  outcome: adminCaseOutcomeEnum("outcome").default('other'),
  region: varchar("region"),
  district: varchar("district"),
  bin: varchar("bin"),
  iin: varchar("iin"),
  article: text("article"),
  protocolNumber: varchar("protocol_number"),
  protocolDate: timestamp("protocol_date"),
  offenderName: varchar("offender_name"),
  offenderBirthDate: timestamp("offender_birth_date"),
  offenderIin: varchar("offender_iin"),
  orgName: varchar("org_name"),
  orgBin: varchar("org_bin"),
  inspectorName: varchar("inspector_name"),
  penaltyType: varchar("penalty_type"),
  resolutionDate: timestamp("resolution_date"),
  fineAmount: decimal("fine_amount", { precision: 15, scale: 2 }),
  finePaidVoluntary: boolean("fine_paid_voluntary"),
  finePaidReduced: boolean("fine_paid_reduced"),
  finePaidForced: boolean("fine_paid_forced"),
  terminationReason: text("termination_reason"),
  terminationDate: timestamp("termination_date"),
  appealResult: text("appeal_result"),
  appealDecisionDate: timestamp("appeal_decision_date"),
  transferTo: varchar("transfer_to"),
  transferType: varchar("transfer_type"),
  enforcementSent: boolean("enforcement_sent"),
  offenderContact: text("offender_contact"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("admin_cases_inspection_id_idx").on(table.inspectionId),
  index("admin_cases_region_idx").on(table.region),
  index("admin_cases_district_idx").on(table.district),
  index("admin_cases_date_idx").on(table.caseDate),
  index("admin_cases_status_idx").on(table.status),
  index("admin_cases_bin_idx").on(table.bin),
  index("admin_cases_iin_idx").on(table.iin),
  index("admin_cases_number_idx").on(table.number),
  index("admin_cases_article_idx").on(table.article),
  index("admin_cases_protocol_number_idx").on(table.protocolNumber),
  index("admin_cases_protocol_date_idx").on(table.protocolDate),
  index("admin_cases_offender_iin_idx").on(table.offenderIin),
  index("admin_cases_org_bin_idx").on(table.orgBin),
  index("admin_cases_penalty_type_idx").on(table.penaltyType),
  index("admin_cases_resolution_date_idx").on(table.resolutionDate),
  index("admin_cases_fine_paid_voluntary_idx").on(table.finePaidVoluntary),
  index("admin_cases_fine_paid_reduced_idx").on(table.finePaidReduced),
  index("admin_cases_fine_paid_forced_idx").on(table.finePaidForced),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  orgUnit: one(orgUnits, {
    fields: [users.orgUnitId],
    references: [orgUnits.id],
  }),
  incidents: many(incidents),
  inspections: many(inspections),
}));

export const orgUnitsRelations = relations(orgUnits, ({ one, many }) => ({
  parent: one(orgUnits, {
    fields: [orgUnits.parentId],
    references: [orgUnits.id],
  }),
  children: many(orgUnits),
  users: many(users),
  incidents: many(incidents),
  packages: many(packages),
  inspections: many(inspections),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  orgUnit: one(orgUnits, {
    fields: [incidents.orgUnitId],
    references: [orgUnits.id],
  }),
  createdByUser: one(users, {
    fields: [incidents.createdBy],
    references: [users.id],
  }),
  package: one(packages, {
    fields: [incidents.packageId],
    references: [packages.id],
  }),
  victims: many(incidentVictims),
}));

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  orgUnit: one(orgUnits, {
    fields: [inspections.orgUnitId],
    references: [orgUnits.id],
  }),
  createdByUser: one(users, {
    fields: [inspections.createdBy],
    references: [users.id],
  }),
  prescriptions: many(prescriptions),
  measures: many(measures),
  adminCases: many(adminCases),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  inspection: one(inspections, {
    fields: [prescriptions.inspectionId],
    references: [inspections.id],
  }),
}));

export const measuresRelations = relations(measures, ({ one }) => ({
  relatedInspection: one(inspections, {
    fields: [measures.relatedInspectionId],
    references: [inspections.id],
  }),
}));

export const adminCasesRelations = relations(adminCases, ({ one }) => ({
  inspection: one(inspections, {
    fields: [adminCases.inspectionId],
    references: [inspections.id],
  }),
}));

export const incidentVictimsRelations = relations(incidentVictims, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentVictims.incidentId],
    references: [incidents.id],
  }),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  orgUnit: one(orgUnits, {
    fields: [packages.orgUnitId],
    references: [orgUnits.id],
  }),
  submittedByUser: one(users, {
    fields: [packages.submittedBy],
    references: [users.id],
  }),
  incidents: many(incidents),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrgUnitSchema = createInsertSchema(orgUnits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents, {
  cause: z.string().trim().optional(),
  causeCode: z.string().trim().optional(),
  causeDetailed: z.string().trim().optional(),
  objectType: z.string().trim().optional(),
  objectCode: z.string().trim().optional(),
  objectDetailed: z.string().trim().optional(),
  timeOfDay: z.preprocess(
    (value) => normalizeTimeOfDayBucket(value),
    z.enum(TIME_OF_DAY_BUCKETS).optional(),
  ),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentVictimSchema = createInsertSchema(incidentVictims).omit({
  id: true,
  createdAt: true,
});

export const insertPackageSchema = createInsertSchema(packages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportFormSchema = createInsertSchema(reportForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertControlObjectSchema = createInsertSchema(controlObjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInspectionSchema = createInsertSchema(inspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMeasureSchema = createInsertSchema(measures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminCaseSchema = createInsertSchema(adminCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = typeof users.$inferInsert;
export type ControlObject = typeof controlObjects.$inferSelect;
export type InsertControlObject = typeof controlObjects.$inferInsert;
export type User = typeof users.$inferSelect;
export type ReportForm = typeof reportForms.$inferSelect;
export type InsertReportForm = typeof reportForms.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type InsertInspection = typeof inspections.$inferInsert;
export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = typeof prescriptions.$inferInsert;
export type Measure = typeof measures.$inferSelect;
export type InsertMeasure = typeof measures.$inferInsert;
export type AdminCase = typeof adminCases.$inferSelect;
export type InsertAdminCase = typeof adminCases.$inferInsert;

export const loginSchema = z.object({
  username: z.string().min(1, "Логин обязателен"),
  password: z.string().min(1, "Пароль обязателен")
});

export type OrgUnit = typeof orgUnits.$inferSelect;

// Схема уведомлений для CRM системы
export const notifications = pgTable('notifications', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => users.id),
  title: varchar('title').notNull(),
  message: text('message').notNull(),
  type: varchar('type', { enum: ['info', 'warning', 'error', 'success'] }).default('info'),
  isRead: boolean('is_read').default(false),
  data: jsonb('data'), // Дополнительные данные в JSON формате
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at'),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Схема для истории действий (аудит)
export const auditLogs = pgTable('audit_logs', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').references(() => users.id),
  action: varchar('action').notNull(), // create, update, delete, view
  entityType: varchar('entity_type').notNull(), // incident, document, report
  entityId: varchar('entity_id').notNull(),
  details: jsonb('details'), // Детали изменений
  ipAddress: varchar('ip_address'),
  userAgent: varchar('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Схема для системы рабочих процессов
export const workflows = pgTable('workflows', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  description: text('description'),
  entityType: varchar('entity_type').notNull(), // document, incident, report
  steps: jsonb('steps').notNull(), // Шаги workflow в JSON
  isActive: boolean('is_active').default(true),
  createdBy: varchar('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

// Экземпляры рабочих процессов
export const workflowInstances = pgTable('workflow_instances', {
  id: varchar('id').primaryKey(),
  workflowId: varchar('workflow_id').references(() => workflows.id),
  entityId: varchar('entity_id').notNull(),
  currentStep: integer('current_step').default(0),
  status: varchar('status', { enum: ['pending', 'approved', 'rejected', 'completed'] }).default('pending'),
  data: jsonb('data'), // Данные процесса
  createdBy: varchar('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = typeof workflowInstances.$inferInsert;
export type InsertOrgUnit = z.infer<typeof insertOrgUnitSchema>;

// Normative documents (regulatory documents with links to Adilet)
export const normativeDocuments = pgTable('normative_documents', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 500 }).notNull(),
  shortTitle: varchar('short_title', { length: 100 }),
  documentNumber: varchar('document_number', { length: 100 }),
  documentDate: varchar('document_date', { length: 50 }),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  externalUrl: varchar('external_url', { length: 1000 }).notNull(),
  source: varchar('source', { length: 100 }).default('adilet'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  createdBy: varchar('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertNormativeDocumentSchema = createInsertSchema(normativeDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NormativeDocument = typeof normativeDocuments.$inferSelect;
export type InsertNormativeDocument = z.infer<typeof insertNormativeDocumentSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type IncidentVictim = typeof incidentVictims.$inferSelect;
export type InsertIncidentVictim = z.infer<typeof insertIncidentVictimSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

// Result tickets (Талоны о результатах проверки)
export const tickets = pgTable('tickets', {
  id: varchar('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  inspectionId: varchar('inspection_id').references(() => inspections.id),
  ticketNumber: varchar('ticket_number', { length: 50 }).notNull(),
  registrationDate: timestamp('registration_date'),
  violationsFound: boolean('violations_found').default(false),
  violationsDescription: text('violations_description'),
  correctiveActions: text('corrective_actions'),
  deadline: timestamp('deadline'),
  responsible: varchar('responsible', { length: 255 }),
  notes: text('notes'),
  region: varchar('region', { length: 100 }),
  district: varchar('district', { length: 100 }),
  createdBy: varchar('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

// Реестр профессиональных противопожарных служб (ППС/НГПС)
export const ppsRegistry = pgTable('pps_registry', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  registryNumber: integer('registry_number').notNull(), // Порядковый номер в реестре
  name: varchar('name').notNull(), // Наименование организации
  serviceType: varchar('service_type').notNull(), // Вид противопожарной службы
  certificateNumber: varchar('certificate_number'), // Номер аттестата
  certificateValidity: varchar('certificate_validity'), // Срок действия аттестата
  address: text('address'), // Адрес
  phone: varchar('phone'), // Телефон
  region: varchar('region'), // Область (извлекается из адреса)
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type PpsRegistry = typeof ppsRegistry.$inferSelect;
export type InsertPpsRegistry = typeof ppsRegistry.$inferInsert;

export const insertPpsRegistrySchema = createInsertSchema(ppsRegistry).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Реестр экспертных организаций аккредитованных на осуществление деятельности по аудиту
export const auditOrgRegistry = pgTable('audit_org_registry', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  registryNumber: integer('registry_number').notNull(),
  name: varchar('name').notNull(),
  applicationNumber: varchar('application_number'),
  certificateInfo: varchar('certificate_info'),
  address: text('address'),
  phone: varchar('phone'),
  directorName: varchar('director_name'),
  region: varchar('region'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type AuditOrgRegistry = typeof auditOrgRegistry.$inferSelect;
export type InsertAuditOrgRegistry = typeof auditOrgRegistry.$inferInsert;

export const insertAuditOrgRegistrySchema = createInsertSchema(auditOrgRegistry).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export document schemas
export * from './document-schema';

// Export chat schemas for AI assistant
export * from './models/chat';
