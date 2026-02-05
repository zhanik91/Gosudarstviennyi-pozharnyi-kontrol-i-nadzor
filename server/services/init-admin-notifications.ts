import { db } from "../storage/db";
import { notifications, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export async function initAdminNotifications(): Promise<void> {
  try {
    const [admin] = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, "admin"))
      .limit(1);

    if (!admin) {
      console.log("[InitNotifications] Admin user not found, skipping");
      return;
    }

    const existingNotifications = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.userId, admin.id))
      .limit(1);

    if (existingNotifications.length > 0) {
      console.log("[InitNotifications] Admin already has notifications, skipping");
      return;
    }

    const now = new Date();
    const initialNotifications = [
      {
        id: crypto.randomUUID(),
        userId: admin.id,
        title: "Срок меры реагирования истекает",
        message: 'Завтра истекает срок МОР №МОР-2026-001 по проверке ТОО "Астана Строй"',
        type: "warning" as const,
        isRead: false,
        data: { deadlineType: "measure_due", entityNumber: "МОР-2026-001", region: "Астана" },
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: admin.id,
        title: "Срок предписания",
        message: "Завтра истекает срок исполнения предписания №ПР-2026-045",
        type: "warning" as const,
        isRead: false,
        data: { deadlineType: "prescription_due", entityNumber: "ПР-2026-045", region: "Алматы" },
        createdAt: new Date(now.getTime() - 300000),
      },
      {
        id: crypto.randomUUID(),
        userId: admin.id,
        title: "Проверка успешно завершена",
        message: 'Проверка №ПР-2026-089 по объекту "Школа №45" завершена без нарушений',
        type: "success" as const,
        isRead: false,
        data: { entityNumber: "ПР-2026-089", region: "Караганда" },
        createdAt: new Date(now.getTime() - 1800000),
      },
      {
        id: crypto.randomUUID(),
        userId: admin.id,
        title: "Новое адм. дело требует решения",
        message: "Поступило адм. дело №АД-2026-023 по ст.410 КоАП РК",
        type: "info" as const,
        isRead: false,
        data: { entityNumber: "АД-2026-023", region: "Шымкент" },
        createdAt: new Date(now.getTime() - 3600000),
      },
    ];

    for (const notification of initialNotifications) {
      await db.insert(notifications).values(notification);
    }

    console.log(`[InitNotifications] Created ${initialNotifications.length} notifications for admin`);
  } catch (error) {
    console.error("[InitNotifications] Error creating admin notifications:", error);
  }
}
