import { db } from "./db";
import { notifications, users, type User, type InsertUser } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class UserStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersCount(): Promise<number> {
    const allUsers = await db.select().from(users);
    return allUsers.length;
  }

  // Методы для системы уведомлений (временно здесь)
  async getUserNotifications(userId: string): Promise<any[]> {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return rows.map((notification) => {
      const data = (notification.data ?? {}) as Record<string, any>;
      return {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type ?? "info",
        isRead: notification.isRead ?? false,
        createdAt: notification.createdAt,
        priority: data.priority ?? "medium",
        recipients: data.recipients ?? [],
        channels: data.channels ?? ["email"],
        status: data.status ?? "sent",
        scheduledAt: data.scheduledAt ?? null,
        sentAt: data.sentAt ?? null,
        createdBy: data.createdBy ?? notification.userId,
        readBy: data.readBy ?? [],
      };
    });
  }
}
