// Расширение storage для работы с документами
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import { documents, documentTags, documentComments } from '@shared/schema';
import type { InsertDocument, Document, InsertDocumentTag, InsertDocumentComment } from '@shared/schema';

export interface DocumentStorage {
  // Документы
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  getDocuments(filters?: {
    orgUnitId?: string;
    documentType?: string;
    status?: string;
    period?: string;
  }): Promise<Document[]>;
  updateDocument(id: string, updates: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string): Promise<boolean>;

  // Теги
  createDocumentTag(tag: InsertDocumentTag): Promise<any>;
  getDocumentTags(orgUnitId: string): Promise<any[]>;

  // Комментарии
  createDocumentComment(comment: InsertDocumentComment): Promise<any>;
  getDocumentComments(documentId: string): Promise<any[]>;
}