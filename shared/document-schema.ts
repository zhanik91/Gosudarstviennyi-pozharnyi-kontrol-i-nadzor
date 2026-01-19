import { sql } from 'drizzle-orm';
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  jsonb,
  integer,
  boolean,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Типы документов в системе МЧС
export const documentTypeEnum = pgEnum('document_type', [
  'report_1_osp',   // Форма 1-ОСП
  'report_2_ssg',   // Форма 2-ССГ  
  'report_3_spvp',  // Форма 3-СПВП
  'report_4_sovp',  // Форма 4-СОВП
  'report_5_spzhs', // Форма 5-СПЖС
  'report_6_sspz',  // Форма 6-ССПЗ
  'report_co',      // Форма СО
  'incident_photo', // Фото происшествия
  'inspection_act', // Акт проверки
  'order',          // Приказ
  'instruction',    // Инструкция
  'other'           // Другое
]);

// Статусы документов
export const documentStatusEnum = pgEnum('document_status', [
  'draft',      // Черновик
  'pending',    // На рассмотрении
  'approved',   // Утвержден
  'rejected',   // Отклонен
  'archived'    // Архивирован
]);

// Таблица документов
export const documents = pgTable('documents', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Основная информация
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  documentType: documentTypeEnum('document_type').notNull(),
  
  // Файл в облачном хранилище
  filePath: varchar('file_path'),      // Путь в Object Storage
  fileName: varchar('file_name'),      // Оригинальное имя файла
  fileSize: integer('file_size'),      // Размер в байтах
  mimeType: varchar('mime_type'),      // MIME тип
  
  // Метаданные
  period: varchar('period'),           // Отчетный период (YYYY-MM)
  region: varchar('region'),           // Область
  orgUnitId: varchar('org_unit_id').notNull(),
  
  // Статус и workflow
  status: documentStatusEnum('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  isPublic: boolean('is_public').default(false),
  
  // Связанные объекты
  incidentId: varchar('incident_id'),  // Связь с происшествием
  packageId: varchar('package_id'),    // Связь с пакетом отчетов
  
  // Пользователи
  createdBy: varchar('created_by').notNull(),
  updatedBy: varchar('updated_by'),
  approvedBy: varchar('approved_by'),
  
  // Временные метки
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
}, (table) => ([
  index('documents_org_unit_id_idx').on(table.orgUnitId),
]));

// Таблица истории версий документов
export const documentVersions = pgTable('document_versions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').notNull(),
  version: integer('version').notNull(),
  filePath: varchar('file_path'),
  fileName: varchar('file_name'),
  changeDescription: text('change_description'),
  createdBy: varchar('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Таблица тегов для организации документов
export const documentTags = pgTable('document_tags', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#3b82f6'), // HEX цвет
  orgUnitId: varchar('org_unit_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ([
  index('document_tags_org_unit_id_idx').on(table.orgUnitId),
]));

// Связующая таблица документов и тегов
export const documentTagRelations = pgTable('document_tag_relations', {
  documentId: varchar('document_id').notNull(),
  tagId: varchar('tag_id').notNull(),
}, (table) => ({
  primary: sql`PRIMARY KEY (${table.documentId}, ${table.tagId})`,
}));

// Комментарии к документам (для workflow)
export const documentComments = pgTable('document_comments', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').notNull(),
  comment: text('comment').notNull(),
  commentType: varchar('comment_type').default('general'), // general, approval, rejection
  createdBy: varchar('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Отношения
export const documentsRelations = relations(documents, ({ one, many }) => ({
  creator: one(documents, {
    fields: [documents.createdBy],
    references: [documents.id],
  }),
  versions: many(documentVersions),
  tags: many(documentTagRelations),
  comments: many(documentComments),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
}));

export const documentTagRelationsRelations = relations(documentTagRelations, ({ one }) => ({
  document: one(documents, {
    fields: [documentTagRelations.documentId],
    references: [documents.id],
  }),
  tag: one(documentTags, {
    fields: [documentTagRelations.tagId],
    references: [documentTags.id],
  }),
}));

export const documentCommentsRelations = relations(documentComments, ({ one }) => ({
  document: one(documents, {
    fields: [documentComments.documentId],
    references: [documents.id],
  }),
}));

// Zod схемы
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectDocumentSchema = createSelectSchema(documents);
export const insertDocumentTagSchema = createInsertSchema(documentTags).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentCommentSchema = createInsertSchema(documentComments).omit({
  id: true,
  createdAt: true,
});

// Типы TypeScript
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentTag = typeof documentTags.$inferSelect;
export type InsertDocumentTag = z.infer<typeof insertDocumentTagSchema>;
export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema>;
