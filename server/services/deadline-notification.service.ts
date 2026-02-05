import { db } from "../storage/db";
import { notifications, users, inspections, prescriptions, measures, adminCases } from "@shared/schema";
import { eq, and, lte, gte, isNotNull, inArray, or } from "drizzle-orm";
import { emailService } from "./email";

// Конфигурация уведомлений
const DEADLINE_CONFIG = {
  daysBeforeDeadline: 1,  // За сколько дней до срока уведомлять
  checkHour: 8,           // Час проверки (утро)
};

// Типы уведомлений о дедлайнах
type DeadlineType =
  | 'inspection_closing'       // Срок закрытия проверки
  | 'violations_deadline'      // Срок устранения нарушений
  | 'prescription_due'         // Срок предписания
  | 'measure_due'              // Срок МОР
  | 'admin_case_resolution';   // Срок решения по адм. делу

// Шаблоны уведомлений
const NOTIFICATION_TEMPLATES: Record<DeadlineType, { title: string; message: (data: any) => string }> = {
  inspection_closing: {
    title: '⚠️ Срок закрытия проверки',
    message: (data) => `Завтра истекает срок закрытия проверки №${data.number} (${data.subjectName || 'Субъект не указан'})`
  },
  violations_deadline: {
    title: '⚠️ Срок устранения нарушений',
    message: (data) => `Завтра истекает срок устранения нарушений по проверке №${data.number}`
  },
  prescription_due: {
    title: '⚠️ Срок предписания',
    message: (data) => `Завтра истекает срок исполнения предписания №${data.number}`
  },
  measure_due: {
    title: '⚠️ Срок меры реагирования',
    message: (data) => `Завтра истекает срок МОР №${data.number}`
  },
  admin_case_resolution: {
    title: '⚠️ Срок решения по адм. делу',
    message: (data) => `Завтра ожидается решение по адм. делу №${data.number}`
  }
};

class DeadlineNotificationService {
  private lastCheckDate: string | null = null;

  /**
   * Получить пользователей для уведомления по региону
   * Возвращает: создателя записи + руководство региона (DCHS) + МЧС
   */
  private async getNotificationRecipients(createdBy: string | null, region: string | null): Promise<string[]> {
    const recipientIds: string[] = [];

    // Добавить создателя только если он существует в базе данных
    if (createdBy) {
      try {
        const [existingUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, createdBy))
          .limit(1);
        
        if (existingUser) {
          recipientIds.push(createdBy);
        }
      } catch (error) {
        console.error('[DeadlineNotification] Error checking creator existence:', error);
      }
    }

    try {
      // Получить руководство: MCHS (центр), DCHS (регион), DISTRICT (район)
      const conditions = [
        or(
          eq(users.role, 'MCHS'),     // Центральный аппарат
          eq(users.role, 'DCHS'),     // Региональное руководство
          eq(users.role, 'DISTRICT')  // Районные инспекторы
        )
      ];

      // Если указан регион, добавить условие
      if (region) {
        conditions.push(
          or(
            eq(users.region, region),
            eq(users.role, 'MCHS')  // МЧС получает все
          )
        );
      }

      const managers = await db
        .select({ id: users.id })
        .from(users)
        .where(and(...conditions));

      managers.forEach(m => {
        if (!recipientIds.includes(m.id)) {
          recipientIds.push(m.id);
        }
      });
    } catch (error) {
      console.error('[DeadlineNotification] Error getting recipients:', error);
    }

    return recipientIds;
  }

  /**
   * Создать уведомление для пользователя
   */
  private async createNotification(
    userId: string,
    deadlineType: DeadlineType,
    entityData: any,
    entityId: string
  ): Promise<void> {
    const template = NOTIFICATION_TEMPLATES[deadlineType];

    try {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId,
        title: template.title,
        message: template.message(entityData),
        type: 'warning',
        isRead: false,
        data: {
          deadlineType,
          entityId,
          entityNumber: entityData.number,
          region: entityData.region,
        },
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('[DeadlineNotification] Error creating notification:', error);
    }
  }

  /**
   * Проверить дедлайны проверок
   */
  private async checkInspectionDeadlines(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    let notificationCount = 0;

    // Проверить actualEndDate
    const expiringInspections = await db
      .select()
      .from(inspections)
      .where(
        and(
          gte(inspections.actualEndDate, tomorrow),
          lte(inspections.actualEndDate, tomorrowEnd),
          inArray(inspections.status, ['planned', 'in_progress'])
        )
      );

    for (const inspection of expiringInspections) {
      const recipients = await this.getNotificationRecipients(inspection.createdBy, inspection.region);
      for (const userId of recipients) {
        await this.createNotification(userId, 'inspection_closing', inspection, inspection.id);
        notificationCount++;
      }
    }

    // Проверить violationsDeadline
    const violationDeadlines = await db
      .select()
      .from(inspections)
      .where(
        and(
          gte(inspections.violationsDeadline, tomorrow),
          lte(inspections.violationsDeadline, tomorrowEnd)
        )
      );

    for (const inspection of violationDeadlines) {
      const recipients = await this.getNotificationRecipients(inspection.createdBy, inspection.region);
      for (const userId of recipients) {
        await this.createNotification(userId, 'violations_deadline', inspection, inspection.id);
        notificationCount++;
      }
    }

    return notificationCount;
  }

  /**
   * Проверить дедлайны предписаний
   */
  private async checkPrescriptionDeadlines(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    let notificationCount = 0;

    const expiringPrescriptions = await db
      .select()
      .from(prescriptions)
      .where(
        and(
          gte(prescriptions.dueDate, tomorrow),
          lte(prescriptions.dueDate, tomorrowEnd),
          inArray(prescriptions.status, ['issued', 'in_progress'])
        )
      );

    for (const prescription of expiringPrescriptions) {
      // Получить создателя из связанной проверки
      const [relatedInspection] = await db
        .select({ createdBy: inspections.createdBy })
        .from(inspections)
        .where(eq(inspections.id, prescription.inspectionId))
        .limit(1);

      const createdBy = relatedInspection?.createdBy || null;
      const recipients = await this.getNotificationRecipients(createdBy, prescription.region);

      for (const userId of recipients) {
        await this.createNotification(userId, 'prescription_due', prescription, prescription.id);
        notificationCount++;
      }
    }

    return notificationCount;
  }

  /**
   * Проверить дедлайны МОР
   */
  private async checkMeasureDeadlines(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    let notificationCount = 0;

    const expiringMeasures = await db
      .select()
      .from(measures)
      .where(
        and(
          gte(measures.dueDate, tomorrow),
          lte(measures.dueDate, tomorrowEnd),
          inArray(measures.status, ['draft', 'in_progress'])
        )
      );

    for (const measure of expiringMeasures) {
      // Получить создателя из связанной проверки
      let createdBy = null;
      if (measure.relatedInspectionId) {
        const [relatedInspection] = await db
          .select({ createdBy: inspections.createdBy })
          .from(inspections)
          .where(eq(inspections.id, measure.relatedInspectionId))
          .limit(1);
        createdBy = relatedInspection?.createdBy || null;
      }

      const recipients = await this.getNotificationRecipients(createdBy, measure.region);

      for (const userId of recipients) {
        await this.createNotification(userId, 'measure_due', measure, measure.id);
        notificationCount++;
      }
    }

    return notificationCount;
  }

  /**
   * Проверить дедлайны адм. дел
   */
  private async checkAdminCaseDeadlines(): Promise<number> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    let notificationCount = 0;

    const expiringCases = await db
      .select()
      .from(adminCases)
      .where(
        and(
          gte(adminCases.resolutionDate, tomorrow),
          lte(adminCases.resolutionDate, tomorrowEnd),
          inArray(adminCases.status, ['opened', 'in_review'])
        )
      );

    for (const adminCase of expiringCases) {
      // Получить создателя из связанной проверки
      let createdBy = null;
      if (adminCase.inspectionId) {
        const [relatedInspection] = await db
          .select({ createdBy: inspections.createdBy })
          .from(inspections)
          .where(eq(inspections.id, adminCase.inspectionId))
          .limit(1);
        createdBy = relatedInspection?.createdBy || null;
      }

      const recipients = await this.getNotificationRecipients(createdBy, adminCase.region);

      for (const userId of recipients) {
        await this.createNotification(userId, 'admin_case_resolution', adminCase, adminCase.id);
        notificationCount++;
      }
    }

    return notificationCount;
  }

  /**
   * Проверить все дедлайны
   */
  async checkAllDeadlines(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Проверяем только раз в день
    if (this.lastCheckDate === today) {
      console.log('[DeadlineNotification] Already checked today, skipping');
      return;
    }

    console.log('[DeadlineNotification] Starting daily deadline check...');

    try {
      const inspectionCount = await this.checkInspectionDeadlines();
      const prescriptionCount = await this.checkPrescriptionDeadlines();
      const measureCount = await this.checkMeasureDeadlines();
      const adminCaseCount = await this.checkAdminCaseDeadlines();

      const totalCount = inspectionCount + prescriptionCount + measureCount + adminCaseCount;

      console.log(`[DeadlineNotification] Check complete. Created ${totalCount} notifications:`);
      console.log(`  - Проверки: ${inspectionCount}`);
      console.log(`  - Предписания: ${prescriptionCount}`);
      console.log(`  - МОР: ${measureCount}`);
      console.log(`  - Адм. дела: ${adminCaseCount}`);

      this.lastCheckDate = today;
    } catch (error) {
      console.error('[DeadlineNotification] Error during check:', error);
    }
  }

  /**
   * Запустить планировщик проверки дедлайнов (каждый день в 8:00)
   */
  startScheduler(): void {
    // Проверить при запуске, если ещё не проверяли сегодня
    const now = new Date();
    if (now.getHours() >= DEADLINE_CONFIG.checkHour) {
      this.checkAllDeadlines();
    }

    // Запланировать ежедневную проверку
    setInterval(() => {
      const currentHour = new Date().getHours();
      if (currentHour === DEADLINE_CONFIG.checkHour) {
        this.checkAllDeadlines();
      }
    }, 60 * 60 * 1000); // Проверяем каждый час, но выполняем только в 8:00

    console.log(`[DeadlineNotification] Scheduler started. Checks run daily at ${DEADLINE_CONFIG.checkHour}:00`);
  }
}

export const deadlineNotificationService = new DeadlineNotificationService();
export default deadlineNotificationService;
