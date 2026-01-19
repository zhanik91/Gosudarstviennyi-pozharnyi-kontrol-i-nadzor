import { db } from "./db";
import { documents } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { isAdmin, type ScopeUser } from "../services/authz";

export class DocumentStorage {
  async createDocument(documentData: any): Promise<any> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async getDocuments(filters: any = {}): Promise<any[]> {
    let query = db.select().from(documents);
    const conditions = [];

    if (filters.orgUnitId) conditions.push(eq(documents.orgUnitId, filters.orgUnitId));
    if (filters.documentType) conditions.push(eq(documents.documentType, filters.documentType));
    if (filters.status) conditions.push(eq(documents.status, filters.status));
    if (filters.period) conditions.push(eq(documents.period, filters.period));
    
    // Документы доступны только админам МЧС
    if (filters.scope && !isAdmin(filters.scope)) {
      return [];
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(documents.createdAt)) as any[];
  }

  async updateDocumentStatus(id: string, status: string): Promise<any> {
    const [document] = await db
      .update(documents)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async getDocumentById(id: string): Promise<any> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // Stubs required by interface or legacy code
  async createNotification(data: any): Promise<any> {
    const notificationData = {
      id: `notif-${Date.now()}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      isRead: false,
      createdAt: new Date(),
      ...data
    };
    return notificationData;
  }

  async getObjectsCount(): Promise<number> {
    return 2156; // Stub
  }

  async getRecentActivities(limit: number = 10): Promise<any[]> {
    return [
      { user: 'Администратор МЧС Алматы', action: 'создал новое происшествие', timestamp: '2 минуты назад', type: 'info' },
      { user: 'Инспектор Шымкент', action: 'утвердил отчет 1-ОСП', timestamp: '15 минут назад', type: 'success' },
      { user: 'Старший специалист Астана', action: 'внес изменения в документ', timestamp: '1 час назад', type: 'warning' }
    ].slice(0, limit);
  }
}
