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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
export const userRoleEnum = pgEnum('user_role', ['editor', 'reviewer', 'approver', 'admin']);

// Organization types enum
export const organizationTypeEnum = pgEnum('organization_type', ['district', 'region', 'rk']);

// Incident types enum
export const incidentTypeEnum = pgEnum('incident_type', [
  'fire', 'nonfire', 'steppe_fire', 'steppe_smolder', 'co_nofire'
]);

// Package status enum
export const packageStatusEnum = pgEnum('package_status', [
  'draft', 'submitted', 'under_review', 'approved', 'rejected'
]);

// Users table for local authentication (МЧС РК)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  username: varchar("username").notNull().unique(),
  password: varchar("password").notNull(),
  fullName: varchar("full_name").notNull(),
  region: varchar("region").notNull(),
  district: varchar("district").default(""),
  email: text("email").notNull().default(""),
  role: userRoleEnum("role").notNull().default('editor'),
  organizationId: varchar("organization_id"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: organizationTypeEnum("type").notNull(),
  parentId: varchar("parent_id"),
  code: varchar("code").unique(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  city: varchar("city"), // Город/район
  
  // Ущерб (тысячи тенге)
  damage: decimal("damage", { precision: 15, scale: 2 }).default('0'),
  
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
  organizationId: varchar("organization_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  packageId: varchar("package_id"),
  status: varchar("status", { enum: ["pending", "investigating", "resolved", "archived"] })
    .notNull()
    .default("pending"),
  archivedAt: timestamp("archived_at"),
  
  // Метки времени
  timeOfDay: varchar("time_of_day"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
  organizationId: varchar("organization_id").notNull(),
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
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  incidents: many(incidents),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
  }),
  children: many(organizations),
  users: many(users),
  incidents: many(incidents),
  packages: many(packages),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [incidents.organizationId],
    references: [organizations.id],
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

export const incidentVictimsRelations = relations(incidentVictims, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentVictims.incidentId],
    references: [incidents.id],
  }),
}));

export const packagesRelations = relations(packages, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [packages.organizationId],
    references: [organizations.id],
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

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
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

// Types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const loginSchema = z.object({
  username: z.string().min(1, "Логин обязателен"),
  password: z.string().min(1, "Пароль обязателен")
});

export type Organization = typeof organizations.$inferSelect;

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
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;

export type IncidentVictim = typeof incidentVictims.$inferSelect;
export type InsertIncidentVictim = z.infer<typeof insertIncidentVictimSchema>;

export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;

// Export document schemas
export * from './document-schema';
