import { db } from "./db";
import { users, type User, type InsertUser } from "@gpkn/shared";
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
    // Временная заглушка - в реальной системе запрос к БД
    return [
      {
        id: 'notif-1',
        title: 'Новое происшествие',
        message: 'Зарегистрирован пожар в вашем районе',
        type: 'warning',
        isRead: false,
        createdAt: new Date()
      }
    ];
  }
}
