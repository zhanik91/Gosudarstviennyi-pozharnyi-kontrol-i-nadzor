import { db } from "./db";
import { auditLogs, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export class AuditStorage {
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const logWithId = {
      ...logData,
      id: crypto.randomUUID(), // Генерируем UUID для записи
    };
    const [log] = await db.insert(auditLogs).values(logWithId as any).returning();
    return log;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(auditLogs.createdAt, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(auditLogs.createdAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(auditLogs.createdAt)) as AuditLog[];
  }
}
