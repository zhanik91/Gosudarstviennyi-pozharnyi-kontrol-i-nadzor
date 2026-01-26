import { db } from "./db";
import { auditLogs, documents, notifications, users } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { applyScopeCondition, type ScopeUser } from "../services/authz";

export class DocumentStorage {
  private formatRelativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "только что";
    if (diffMinutes < 60) return `${diffMinutes} мин. назад`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн. назад`;
  }

  async createDocument(documentData: any): Promise<any> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async getDocuments(filters: {
    orgUnitId?: string;
    documentType?: string;
    status?: string;
    period?: string;
    scopeUser?: ScopeUser;
  } = {}): Promise<any[]> {
    let query = db.select().from(documents);
    const conditions = [];

    if (filters.orgUnitId) conditions.push(eq(documents.orgUnitId, filters.orgUnitId));
    if (filters.documentType) conditions.push(eq(documents.documentType, filters.documentType));
    if (filters.status) conditions.push(eq(documents.status, filters.status));
    if (filters.period) conditions.push(eq(documents.period, filters.period));

    if (filters.scopeUser) {
      const scopeCondition = applyScopeCondition(filters.scopeUser, documents.region);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
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

  // Notifications
  async createNotification(data: any): Promise<any> {
    const {
      userId,
      createdBy,
      title,
      message,
      type,
      isRead,
      createdAt,
      data: payloadData,
      ...rest
    } = data || {};

    const resolvedUserId = userId || createdBy;
    if (!resolvedUserId) {
      throw new Error("userId is required to create a notification");
    }

    const notificationData = {
      id: crypto.randomUUID(),
      userId: resolvedUserId,
      title,
      message,
      type: type || "info",
      isRead: Boolean(isRead),
      data: {
        ...payloadData,
        ...rest,
        createdBy,
      },
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    };

    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getObjectsCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents);
    return Number(result?.count ?? 0);
  }

  async getRecentActivities(limit: number = 10): Promise<any[]> {
    const rows = await db
      .select({
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        createdAt: auditLogs.createdAt,
        userName: users.fullName,
        username: users.username,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return rows.map((row) => {
      const action = row.action?.toLowerCase() ?? "";
      let type: "info" | "success" | "warning" | "error" = "info";

      if (action.includes("approve")) type = "success";
      if (action.includes("reject") || action.includes("error")) type = "error";
      if (action.includes("warning")) type = "warning";

      const userName = row.userName || row.username || "Система";
      const timestamp = row.createdAt
        ? this.formatRelativeTime(new Date(row.createdAt))
        : "—";

      return {
        user: userName,
        action: row.entityType ? `${row.action} ${row.entityType}` : row.action,
        timestamp,
        type,
      };
    });
  }
}
