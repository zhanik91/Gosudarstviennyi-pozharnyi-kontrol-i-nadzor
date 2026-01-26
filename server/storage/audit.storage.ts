import { db } from "./db";
import { auditLogs, users, type AuditLog, type InsertAuditLog } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { applyScopeCondition, type ScopeUser } from "../services/authz";

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
    scopeUser?: ScopeUser;
  }): Promise<AuditLog[]> {
    let query = db.select({ audit: auditLogs }).from(auditLogs);
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

    if (filters?.scopeUser) {
      const scopeCondition = applyScopeCondition(filters.scopeUser, users.region, users.district);
      if (scopeCondition) {
        query = query.leftJoin(users, eq(auditLogs.userId, users.id));
        conditions.push(scopeCondition);
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(auditLogs.createdAt));
    return rows.map((row) => row.audit) as AuditLog[];
  }
}
