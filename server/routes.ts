import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { adminCases, controlObjects, incidents, inspections, measures, prescriptions, tickets } from "@shared/schema";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { setupLocalAuth, isAuthenticated } from "./auth-local";
import { incidentController } from "./controllers/incident.controller";
import { organizationController } from "./controllers/organization.controller";
import { packageController } from "./controllers/package.controller";
import { documentController } from "./controllers/document.controller";
import { reportController } from "./controllers/report.controller";
import { exportController } from "./controllers/export.controller";
import { adminController } from "./controllers/admin.controller";
import { statsController } from "./controllers/stats.controller";
import { auditController } from "./controllers/audit.controller";
import { analyticsController } from "./controllers/analytics.controller";
import { generateController } from "./controllers/generate.controller";
import { form13KpsController } from "./controllers/form-13-kps.controller";
import { adminPracticeReportController } from "./controllers/admin-practice-report.controller";
import { toScopeUser, applyScopeCondition } from "./services/authz";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupLocalAuth(app);

  // === Проверка прав на запись ===
  const canWriteRegistry = (req: any, res: any, next: any) => {
    const userRole = req.user?.role?.toUpperCase?.() ?? req.user?.role;
    if (userRole === 'MCHS') {
      return res.status(403).json({ message: 'У вас нет прав на редактирование. Доступ только для чтения.' });
    }
    next();
  };

  const buildScopeWriteCheck = ({
    table,
    regionColumn,
    districtColumn,
    regionKey = 'region',
    districtKey = 'district',
  }: {
    table: any;
    regionColumn: any;
    districtColumn?: any;
    regionKey?: string;
    districtKey?: string;
  }) => async (req: any, res: any, next: any) => {
    const userRole = req.user?.role?.toUpperCase?.() ?? req.user?.role;
    const userRegion = req.user?.region;
    const userDistrict = req.user?.district;

    if (userRole === 'ADMIN') {
      return next();
    }

    let existingRegion = req.body?.[regionKey];
    let existingDistrict = req.body?.[districtKey];

    if (req.params?.id) {
      try {
        const selection: Record<string, any> = { region: regionColumn };
        if (districtColumn) {
          selection.district = districtColumn;
        }
        const existing = await db
          .select(selection)
          .from(table)
          .where(eq(table.id, req.params.id))
          .limit(1);
        if (existing[0]) {
          existingRegion = existing[0].region;
          existingDistrict = existing[0].district;
        }
      } catch (error) {
        console.error('Error checking registry scope:', error);
      }
    }

    const targetRegion = req.body?.[regionKey] ?? existingRegion;
    const targetDistrict = req.body?.[districtKey] ?? existingDistrict;

    if (userRole === 'DCHS' && userRegion) {
      if (targetRegion && targetRegion !== userRegion) {
        return res.status(403).json({
          message: 'Вы можете редактировать данные только вашего региона: ' + userRegion
        });
      }
      return next();
    }

    if ((userRole === 'OCHS' || userRole === 'DISTRICT') && userRegion && userDistrict) {
      if (targetRegion && targetRegion !== userRegion) {
        return res.status(403).json({
          message: 'Вы можете редактировать данные только вашего региона: ' + userRegion
        });
      }
      if (targetDistrict && targetDistrict !== userDistrict) {
        return res.status(403).json({
          message: 'Вы можете редактировать данные только вашего района: ' + userDistrict
        });
      }
      return next();
    }

    next();
  };

  const checkIncidentWriteScope = buildScopeWriteCheck({
    table: incidents,
    regionColumn: incidents.region,
    districtColumn: incidents.city,
    districtKey: 'city',
  });

  // === Организации ===
  app.get('/api/organizations', isAuthenticated, organizationController.getOrganizations);
  app.post('/api/organizations', isAuthenticated, organizationController.createOrganization);
  app.get('/api/organizations/:id/hierarchy', isAuthenticated, organizationController.getHierarchy);

  // === Инциденты ===
  app.get('/api/incidents/search', isAuthenticated, incidentController.searchIncidents);
  app.get('/api/incidents/:id', isAuthenticated, incidentController.getIncident);
  app.get('/api/incidents', isAuthenticated, incidentController.getIncidents);
  app.post('/api/incidents', isAuthenticated, canWriteRegistry, checkIncidentWriteScope, incidentController.createIncident);
  app.put('/api/incidents/:id', isAuthenticated, canWriteRegistry, checkIncidentWriteScope, incidentController.updateIncident);
  app.delete('/api/incidents/:id', isAuthenticated, canWriteRegistry, checkIncidentWriteScope, incidentController.deleteIncident);

  // === Генерация тестовых инцидентов ===
  app.post('/api/generate/incidents', isAuthenticated, generateController.generateIncidents);

  // === Пакеты ===
  app.get('/api/packages', isAuthenticated, packageController.getPackages);
  app.post('/api/packages', isAuthenticated, packageController.createPackage);
  app.put('/api/packages/:id/submit', isAuthenticated, packageController.submitPackage);
  app.put('/api/packages/:id/approve', isAuthenticated, packageController.approvePackage);
  app.post('/api/packages/:id/approve', isAuthenticated, packageController.approvePackage);
  app.put('/api/packages/:id/reject', isAuthenticated, packageController.rejectPackage);
  app.post('/api/packages/:id/return', isAuthenticated, packageController.rejectPackage);
  app.get('/api/packages/:id/view', isAuthenticated, packageController.viewPackage);
  app.get('/api/packages/:id/download', isAuthenticated, packageController.downloadPackage);
  app.post('/api/packages/consolidate', isAuthenticated, packageController.consolidatePackage);

  // === Документы ===
  app.post('/api/documents/upload-url', isAuthenticated, documentController.getUploadUrl);
  app.post('/api/documents', isAuthenticated, documentController.createDocument);
  app.get('/api/documents', isAuthenticated, documentController.getDocuments);
  app.get('/documents/:documentPath(*)', isAuthenticated, documentController.downloadDocument);
  app.post('/api/documents/upload', isAuthenticated, documentController.createDocument);
  app.put('/api/documents/:id/status', isAuthenticated, documentController.updateStatus);
  app.delete('/api/documents/:id', isAuthenticated, documentController.deleteDocument);
  app.get("/public-objects/:filePath(*)", documentController.getPublicObject);

  // === Отчеты ===
  app.get('/api/reports', isAuthenticated, reportController.getReports);
  app.post('/api/reports', isAuthenticated, reportController.saveReport);
  app.put('/api/reports', isAuthenticated, reportController.saveReport);
  app.get('/api/reports/summary', isAuthenticated, reportController.getReportsDashboard);
  app.get('/api/stats/dashboard', reportController.getDashboardStats);
  app.get('/api/reports/validate', isAuthenticated, reportController.validateReports);
  app.get('/api/reports/form-13-kps', isAuthenticated, form13KpsController.getReport);
  app.get('/api/reports/admin-practice', isAuthenticated, adminPracticeReportController.getReport);
  app.get('/api/reports/admin-cases', isAuthenticated, async (req: any, res) => {
    try {
      const { period, dateFrom, dateTo, region, district, article } = req.query;
      const scopeUser = toScopeUser(req.user);

      const allowedPeriods = ['quarter', 'year'];
      const periodValue = allowedPeriods.includes(period as string) ? (period as string) : 'quarter';
      const periodExpression = sql`date_trunc(${sql.raw(`'${periodValue}'`)}, ${adminCases.caseDate})`;

      const conditions = [];
      const scopeCondition = applyScopeCondition(scopeUser, adminCases.region, adminCases.district);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }

      if (region && region !== 'all') {
        conditions.push(eq(adminCases.region, region as string));
      }
      if (district && district !== 'all') {
        conditions.push(eq(adminCases.district, district as string));
      }
      if (dateFrom) {
        conditions.push(gte(adminCases.caseDate, new Date(dateFrom as string)));
      }
      if (dateTo) {
        conditions.push(lte(adminCases.caseDate, new Date(dateTo as string)));
      }
      if (article && article !== 'all') {
        const articleValues = typeof article === 'string'
          ? article.split(',').map((value) => value.trim()).filter(Boolean)
          : Array.isArray(article) ? article : [];
        if (articleValues.length === 1) {
          conditions.push(eq(adminCases.article, articleValues[0]));
        } else if (articleValues.length > 1) {
          conditions.push(inArray(adminCases.article, articleValues));
        }
      }

      let query = db.select({
        period: periodExpression,
        article: adminCases.article,
        totalCount: sql<number>`count(*)`,
        totalFines: sql<number>`coalesce(sum(${adminCases.fineAmount}), 0)`,
        paidVoluntaryCount: sql<number>`sum(case when ${adminCases.paymentType} = 'voluntary' then 1 else 0 end)`,
        paidForcedCount: sql<number>`sum(case when ${adminCases.paymentType} = 'forced' then 1 else 0 end)`,
        paidVoluntaryShare: sql<number>`coalesce(sum(case when ${adminCases.paymentType} = 'voluntary' then 1 else 0 end)::float / nullif(count(*), 0), 0)`,
        paidForcedShare: sql<number>`coalesce(sum(case when ${adminCases.paymentType} = 'forced' then 1 else 0 end)::float / nullif(count(*), 0), 0)`,
        warningsCount: sql<number>`sum(case when ${adminCases.outcome} = 'warning' then 1 else 0 end)`,
        terminationsCount: sql<number>`sum(case when ${adminCases.outcome} = 'termination' then 1 else 0 end)`,
        appealsCount: sql<number>`sum(case when ${adminCases.type} = 'appeal' then 1 else 0 end)`,
        openedCount: sql<number>`sum(case when ${adminCases.status} = 'opened' then 1 else 0 end)`,
        inReviewCount: sql<number>`sum(case when ${adminCases.status} = 'in_review' then 1 else 0 end)`,
        resolvedCount: sql<number>`sum(case when ${adminCases.status} = 'resolved' then 1 else 0 end)`,
        closedCount: sql<number>`sum(case when ${adminCases.status} = 'closed' then 1 else 0 end)`,
        canceledCount: sql<number>`sum(case when ${adminCases.status} = 'canceled' then 1 else 0 end)`,
      }).from(adminCases);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rows = await query
        .groupBy(periodExpression, adminCases.article)
        .orderBy(periodExpression, adminCases.article);
      res.json(rows);
    } catch (error) {
      console.error('Error loading admin cases report:', error);
      res.status(500).json({ message: 'Ошибка загрузки отчета по административным делам' });
    }
  });

  // === Экспорт ===
  app.get('/api/export/report', isAuthenticated, exportController.exportReport);

  // === Администрирование (Users) ===
  const adminRouter = Router();
  adminRouter.use(adminController.requireAdmin);
  adminRouter.get('/users', adminController.getUsers);
  adminRouter.post('/users', adminController.createUser);
  adminRouter.put('/users/:id', adminController.updateUser);
  adminRouter.delete('/users/:id', adminController.deleteUser);
  adminRouter.post('/users/:id/reset-password', adminController.resetPassword);
  app.use('/api/admin', adminRouter);

  // === Статистика ===
  app.get('/api/stats', isAuthenticated, statsController.getStats);
  app.get('/api/analytics/simple', isAuthenticated, analyticsController.getSimpleAnalytics);
  app.get('/api/analytics/forms', isAuthenticated, analyticsController.getFormAnalytics);
  app.get('/api/analytics/advanced', isAuthenticated, analyticsController.getAdvancedAnalytics);
  app.get('/api/analytics/charts', isAuthenticated, analyticsController.getReportFormsCharts);

  // === Audit Logs (Admin) ===
  app.get('/api/audit-logs', isAuthenticated, auditController.getLogs);

  // === Регистрируем bulk операции ===
  const { registerBulkIncidentRoutes } = await import('./routes/incidents-bulk');
  registerBulkIncidentRoutes(app);

  // === СИСТЕМА УВЕДОМЛЕНИЙ ===
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Ошибка загрузки уведомлений' });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const notificationData = {
        ...req.body,
        createdBy: userId,
        createdAt: new Date()
      };
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ message: 'Ошибка создания уведомления' });
    }
  });

  // === СИСТЕМА WORKFLOW (Stub) ===
  app.get('/api/workflows', isAuthenticated, async (req: any, res) => {
    res.json([{ id: 'workflow-1', title: 'Stub Workflow' }]);
  });
  app.post('/api/workflows/:id/approve', isAuthenticated, async (req: any, res) => {
    res.json({ success: true, message: 'Документ утвержден' });
  });
  app.post('/api/workflows/:id/reject', isAuthenticated, async (req: any, res) => {
    res.json({ success: true, message: 'Документ отклонен' });
  });

  // === СИСТЕМА УВЕДОМЛЕНИЙ О ДЕДЛАЙНАХ ===
  // Ручной запуск проверки дедлайнов (для тестирования / администраторов)
  app.post('/api/notifications/check-deadlines', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role?.toUpperCase?.() ?? req.user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'MCHS') {
        return res.status(403).json({ message: 'Доступ только для администраторов' });
      }

      const { deadlineNotificationService } = await import('./services/deadline-notification.service');
      await deadlineNotificationService.checkAllDeadlines();
      res.json({ success: true, message: 'Проверка дедлайнов выполнена' });
    } catch (error) {
      console.error('Error checking deadlines:', error);
      res.status(500).json({ message: 'Ошибка проверки дедлайнов' });
    }
  });

  // Создание тестовых уведомлений для демонстрации
  app.post('/api/notifications/create-demo', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
      }

      const demoNotifications = [
        {
          id: crypto.randomUUID(),
          userId,
          title: 'Срок меры реагирования истекает',
          message: 'Завтра истекает срок МОР №МОР-2026-001 по проверке ТОО "Астана Строй"',
          type: 'warning' as const,
          isRead: false,
          data: { deadlineType: 'measure_due', entityNumber: 'МОР-2026-001', region: 'Астана' },
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          userId,
          title: 'Срок предписания',
          message: 'Завтра истекает срок исполнения предписания №ПР-2026-045 (устранение нарушений пожарной безопасности)',
          type: 'warning' as const,
          isRead: false,
          data: { deadlineType: 'prescription_due', entityNumber: 'ПР-2026-045', region: 'Алматы' },
          createdAt: new Date(Date.now() - 300000),
        },
        {
          id: crypto.randomUUID(),
          userId,
          title: 'Срок закрытия проверки',
          message: 'Завтра истекает срок закрытия проверки №ПР-2026-112 (ТЦ "Mega Silk Way")',
          type: 'warning' as const,
          isRead: false,
          data: { deadlineType: 'inspection_closing', entityNumber: 'ПР-2026-112', region: 'Астана' },
          createdAt: new Date(Date.now() - 600000),
        },
        {
          id: crypto.randomUUID(),
          userId,
          title: 'Проверка успешно завершена',
          message: 'Проверка №ПР-2026-089 по объекту "Школа №45" завершена без нарушений',
          type: 'success' as const,
          isRead: false,
          data: { entityNumber: 'ПР-2026-089', region: 'Караганда' },
          createdAt: new Date(Date.now() - 1800000),
        },
        {
          id: crypto.randomUUID(),
          userId,
          title: 'Новое адм. дело требует решения',
          message: 'Поступило адм. дело №АД-2026-023 по ст.410 КоАП РК (нарушение требований пож. безопасности)',
          type: 'info' as const,
          isRead: false,
          data: { entityNumber: 'АД-2026-023', region: 'Шымкент' },
          createdAt: new Date(Date.now() - 3600000),
        },
      ];

      let created = 0;
      for (const notification of demoNotifications) {
        try {
          await storage.createNotification(notification);
          created++;
        } catch (err) {
          console.error('[Demo notifications] Error creating notification:', err);
        }
      }

      res.json({ 
        success: true, 
        message: `Создано ${created} тестовых уведомлений для демонстрации`,
        count: created 
      });
    } catch (error) {
      console.error('Error creating demo notifications:', error);
      res.status(500).json({ message: 'Ошибка создания тестовых уведомлений' });
    }
  });

  // === ИНТЕРАКТИВНЫЕ КАРТЫ & Forecasts (Stub/Logic) ===
  app.get('/api/maps/data', isAuthenticated, async (req: any, res) => {
    try {
      const { region, district, timeRange } = req.query;
      const analyticsData = await storage.getAdvancedAnalytics({
        period: timeRange,
        orgUnitId: region,
        scopeUser: toScopeUser(req.user),
      });

      // Get incidents with coordinates
      const incidentsResult = await storage.getIncidents({
        scopeUser: toScopeUser(req.user),
      });

      // Handle both array and paginated response
      const incidents = Array.isArray(incidentsResult)
        ? incidentsResult
        : (incidentsResult as any).items || [];

      const regionFilter = typeof region === 'string' && region !== 'all' ? region : null;
      const districtFilter = typeof district === 'string' && district !== 'all' ? district : null;

      const incidentsWithCoords = incidents
        .filter((inc: any) => {
          if (regionFilter && inc.region !== regionFilter) {
            return false;
          }
          if (districtFilter && inc.city !== districtFilter) {
            return false;
          }
          return true;
        })
        .filter((inc: any) => inc.latitude && inc.longitude)
        .map((inc: any) => ({
          id: inc.id,
          type: 'incident',
          latitude: parseFloat(inc.latitude),
          longitude: parseFloat(inc.longitude),
          title: inc.address || 'Происшествие',
          details: {
            incidentType: inc.incidentType,
            dateTime: inc.dateTime,
            damage: inc.damage,
            address: inc.address,
            region: inc.region,
            district: inc.city,
          }
        }));

      res.json({
        regions: analyticsData.regionStats || [],
        incidents: incidentsWithCoords,
        heatmapData: [],
        trends: []
      });
    } catch (error) {
      console.error('Error loading map data:', error);
      res.status(500).json({ message: 'Ошибка загрузки данных карты' });
    }
  });

  // Update incident coordinates
  app.patch('/api/incidents/:id', isAuthenticated, canWriteRegistry, checkIncidentWriteScope, async (req: any, res) => {
    try {
      const { latitude, longitude } = req.body;
      const [incident] = await db.update(incidents)
        .set({
          latitude: latitude || null,
          longitude: longitude || null,
          updatedAt: new Date()
        })
        .where(eq(incidents.id, req.params.id))
        .returning();

      if (!incident) return res.status(404).json({ message: 'Инцидент не найден' });
      res.json(incident);
    } catch (error) {
      console.error('Error updating incident coordinates:', error);
      res.status(500).json({ message: 'Ошибка обновления координат' });
    }
  });

  // === ПРОВЕРКИ / ПРЕДПИСАНИЯ / МЕРЫ / АДМИН ДЕЛА ===

  const buildRegistryFilters = (
    table: any,
    dateColumn: any,
    searchColumns: any[],
    req: any,
  ) => {
    const { region, district, status, dateFrom, dateTo, search } = req.query;
    const scopeUser = toScopeUser(req.user);
    const conditions = [];

    const scopeCondition = applyScopeCondition(scopeUser, table.region, table.district);
    if (scopeCondition) {
      conditions.push(scopeCondition);
    }

    const normalizeStatus = (value: any) => {
      if (!value || value === 'all') {
        return [];
      }
      if (Array.isArray(value)) {
        return value.filter((item) => item && item !== 'all');
      }
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item && item !== 'all');
      }
      return [];
    };

    if (region && region !== 'all') {
      conditions.push(eq(table.region, region as string));
    }
    if (district && district !== 'all') {
      conditions.push(eq(table.district, district as string));
    }
    const statusValues = normalizeStatus(status);
    if (statusValues.length === 1) {
      conditions.push(eq(table.status, statusValues[0] as any));
    } else if (statusValues.length > 1) {
      conditions.push(inArray(table.status, statusValues as any[]));
    }
    if (dateFrom) {
      conditions.push(gte(dateColumn, new Date(dateFrom as string)));
    }
    if (dateTo) {
      conditions.push(lte(dateColumn, new Date(dateTo as string)));
    }
    if (search) {
      const likeValue = `%${search}%`;
      conditions.push(or(...searchColumns.map((column) => ilike(column, likeValue))));
    }

    return conditions;
  };

  app.get('/api/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const conditions = buildRegistryFilters(
        inspections,
        inspections.inspectionDate,
        [inspections.number, inspections.bin, inspections.iin, inspections.subjectName, inspections.address],
        req,
      );

      let query = db.select().from(inspections);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(desc(inspections.inspectionDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading inspections:', error);
      res.status(500).json({ message: 'Ошибка загрузки проверок' });
    }
  });

  const toOptionalDate = (value?: string | null) => (value ? new Date(value) : null);
  const toRequiredDate = (value?: string | null) => (value ? new Date(value) : new Date());
  const toOptionalNumber = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const numeric = Number(value);
    return Number.isNaN(numeric) ? null : numeric;
  };

  app.post('/api/inspections', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: inspections,
    regionColumn: inspections.region,
    districtColumn: inspections.district,
  }), async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const orgUnitId = req.user?.orgUnitId || null;
      const payload = req.body || {};
      const [inspection] = await db.insert(inspections).values({
        ...payload,
        inspectionDate: toRequiredDate(payload.inspectionDate),
        ukpsisuRegistrationDate: toOptionalDate(payload.ukpsisuRegistrationDate),
        actualStartDate: toOptionalDate(payload.actualStartDate),
        actualEndDate: toOptionalDate(payload.actualEndDate),
        violationsDeadline: toOptionalDate(payload.violationsDeadline),
        ticketRegistrationDate: toOptionalDate(payload.ticketRegistrationDate),
        violationsCount: toOptionalNumber(payload.violationsCount),
        orgUnitId,
        createdBy: userId,
      }).returning();
      res.json(inspection);
    } catch (error) {
      console.error('Error creating inspection:', error);
      res.status(500).json({ message: 'Ошибка создания проверки' });
    }
  });

  app.put('/api/inspections/:id', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: inspections,
    regionColumn: inspections.region,
    districtColumn: inspections.district,
  }), async (req: any, res) => {
    try {
      const payload = req.body || {};
      const [inspection] = await db.update(inspections)
        .set({
          ...payload,
          inspectionDate: toRequiredDate(payload.inspectionDate),
          ukpsisuRegistrationDate: toOptionalDate(payload.ukpsisuRegistrationDate),
          actualStartDate: toOptionalDate(payload.actualStartDate),
          actualEndDate: toOptionalDate(payload.actualEndDate),
          violationsDeadline: toOptionalDate(payload.violationsDeadline),
          ticketRegistrationDate: toOptionalDate(payload.ticketRegistrationDate),
          violationsCount: toOptionalNumber(payload.violationsCount),
          updatedAt: new Date(),
        })
        .where(eq(inspections.id, req.params.id))
        .returning();
      if (!inspection) {
        return res.status(404).json({ message: 'Проверка не найдена' });
      }
      res.json(inspection);
    } catch (error) {
      console.error('Error updating inspection:', error);
      res.status(500).json({ message: 'Ошибка обновления проверки' });
    }
  });

  app.get('/api/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const conditions = buildRegistryFilters(
        prescriptions,
        prescriptions.issueDate,
        [prescriptions.number, prescriptions.bin, prescriptions.iin, prescriptions.description],
        req,
      );

      let query = db.select().from(prescriptions);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(desc(prescriptions.issueDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      res.status(500).json({ message: 'Ошибка загрузки предписаний' });
    }
  });

  app.post('/api/prescriptions', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: prescriptions,
    regionColumn: prescriptions.region,
    districtColumn: prescriptions.district,
  }), async (req: any, res) => {
    try {
      const [prescription] = await db.insert(prescriptions).values({
        ...req.body,
      }).returning();
      res.json(prescription);
    } catch (error) {
      console.error('Error creating prescription:', error);
      res.status(500).json({ message: 'Ошибка создания предписания' });
    }
  });

  app.put('/api/prescriptions/:id', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: prescriptions,
    regionColumn: prescriptions.region,
    districtColumn: prescriptions.district,
  }), async (req: any, res) => {
    try {
      const [prescription] = await db.update(prescriptions)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(prescriptions.id, req.params.id))
        .returning();
      if (!prescription) {
        return res.status(404).json({ message: 'Предписание не найдено' });
      }
      res.json(prescription);
    } catch (error) {
      console.error('Error updating prescription:', error);
      res.status(500).json({ message: 'Ошибка обновления предписания' });
    }
  });

  app.get('/api/measures', isAuthenticated, async (req: any, res) => {
    try {
      const conditions = buildRegistryFilters(
        measures,
        measures.measureDate,
        [measures.number, measures.bin, measures.iin, measures.description],
        req,
      );

      let query = db.select().from(measures);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(desc(measures.measureDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading measures:', error);
      res.status(500).json({ message: 'Ошибка загрузки мер реагирования' });
    }
  });

  app.post('/api/measures', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: measures,
    regionColumn: measures.region,
    districtColumn: measures.district,
  }), async (req: any, res) => {
    try {
      const [measure] = await db.insert(measures).values({
        ...req.body,
      }).returning();
      res.json(measure);
    } catch (error) {
      console.error('Error creating measure:', error);
      res.status(500).json({ message: 'Ошибка создания меры реагирования' });
    }
  });

  app.put('/api/measures/:id', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: measures,
    regionColumn: measures.region,
    districtColumn: measures.district,
  }), async (req: any, res) => {
    try {
      const [measure] = await db.update(measures)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(measures.id, req.params.id))
        .returning();
      if (!measure) {
        return res.status(404).json({ message: 'Мера реагирования не найдена' });
      }
      res.json(measure);
    } catch (error) {
      console.error('Error updating measure:', error);
      res.status(500).json({ message: 'Ошибка обновления меры реагирования' });
    }
  });

  app.get('/api/control-supervision/prescriptions', isAuthenticated, async (req: any, res) => {
    try {
      const { region, district, status, dateFrom, dateTo, search, inspectionNumber } = req.query;
      const scopeUser = toScopeUser(req.user);
      const conditions = [];

      const scopeCondition = applyScopeCondition(scopeUser, prescriptions.region, prescriptions.district);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
      if (region && region !== 'all') {
        conditions.push(eq(prescriptions.region, region as string));
      }
      if (district && district !== 'all') {
        conditions.push(eq(prescriptions.district, district as string));
      }
      if (status && status !== 'all') {
        conditions.push(eq(prescriptions.status, status as any));
      }
      if (dateFrom) {
        conditions.push(gte(prescriptions.issueDate, new Date(dateFrom as string)));
      }
      if (dateTo) {
        conditions.push(lte(prescriptions.issueDate, new Date(dateTo as string)));
      }
      if (inspectionNumber) {
        conditions.push(ilike(inspections.number, `%${inspectionNumber}%`));
      }
      if (search) {
        const likeValue = `%${search}%`;
        conditions.push(or(
          ilike(prescriptions.number, likeValue),
          ilike(prescriptions.bin, likeValue),
          ilike(prescriptions.iin, likeValue),
          ilike(prescriptions.description, likeValue),
          ilike(inspections.number, likeValue),
          ilike(inspections.subjectName, likeValue),
          ilike(inspections.address, likeValue),
        ));
      }

      let query = db.select({
        id: prescriptions.id,
        inspectionId: prescriptions.inspectionId,
        number: prescriptions.number,
        issueDate: prescriptions.issueDate,
        dueDate: prescriptions.dueDate,
        status: prescriptions.status,
        region: prescriptions.region,
        district: prescriptions.district,
        bin: prescriptions.bin,
        iin: prescriptions.iin,
        description: prescriptions.description,
        inspectionNumber: inspections.number,
        subjectName: inspections.subjectName,
        address: inspections.address,
      }).from(prescriptions)
        .leftJoin(inspections, eq(prescriptions.inspectionId, inspections.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(desc(prescriptions.issueDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading prescriptions overview:', error);
      res.status(500).json({ message: 'Ошибка загрузки предписаний' });
    }
  });

  app.get('/api/control-supervision/measures', isAuthenticated, async (req: any, res) => {
    try {
      const { region, district, status, dateFrom, dateTo, search, inspectionNumber, type } = req.query;
      const scopeUser = toScopeUser(req.user);
      const conditions = [];

      const scopeCondition = applyScopeCondition(scopeUser, measures.region, measures.district);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
      if (region && region !== 'all') {
        conditions.push(eq(measures.region, region as string));
      }
      if (district && district !== 'all') {
        conditions.push(eq(measures.district, district as string));
      }
      if (status && status !== 'all') {
        conditions.push(eq(measures.status, status as any));
      }
      if (type && type !== 'all') {
        conditions.push(eq(measures.type, type as any));
      }
      if (dateFrom) {
        conditions.push(gte(measures.measureDate, new Date(dateFrom as string)));
      }
      if (dateTo) {
        conditions.push(lte(measures.measureDate, new Date(dateTo as string)));
      }
      if (inspectionNumber) {
        conditions.push(ilike(inspections.number, `%${inspectionNumber}%`));
      }
      if (search) {
        const likeValue = `%${search}%`;
        conditions.push(or(
          ilike(measures.number, likeValue),
          ilike(measures.bin, likeValue),
          ilike(measures.iin, likeValue),
          ilike(measures.description, likeValue),
          ilike(inspections.number, likeValue),
          ilike(inspections.subjectName, likeValue),
          ilike(inspections.address, likeValue),
        ));
      }

      let query = db.select({
        id: measures.id,
        relatedInspectionId: measures.relatedInspectionId,
        number: measures.number,
        measureDate: measures.measureDate,
        type: measures.type,
        status: measures.status,
        region: measures.region,
        district: measures.district,
        bin: measures.bin,
        iin: measures.iin,
        description: measures.description,
        inspectionNumber: inspections.number,
        subjectName: inspections.subjectName,
        address: inspections.address,
      }).from(measures)
        .leftJoin(inspections, eq(measures.relatedInspectionId, inspections.id));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(desc(measures.measureDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading measures overview:', error);
      res.status(500).json({ message: 'Ошибка загрузки мер реагирования' });
    }
  });

  // === Талоны о результатах проверки ===
  app.get('/api/tickets', isAuthenticated, async (req: any, res) => {
    try {
      const { inspectionId, region, district } = req.query;
      const scopeUser = toScopeUser(req.user);
      const scopeCondition = applyScopeCondition(scopeUser, tickets.region, tickets.district);
      const conditions = [];
      if (scopeCondition) conditions.push(scopeCondition);
      if (inspectionId) conditions.push(eq(tickets.inspectionId, inspectionId as string));
      if (region) conditions.push(eq(tickets.region, region as string));
      if (district) conditions.push(eq(tickets.district, district as string));
      let query = db.select().from(tickets);
      if (conditions.length > 0) query = query.where(and(...conditions));
      const result = await query.orderBy(desc(tickets.registrationDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading tickets:', error);
      res.status(500).json({ message: 'Ошибка загрузки талонов' });
    }
  });

  app.post('/api/tickets', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: tickets,
    regionColumn: tickets.region,
    districtColumn: tickets.district,
  }), async (req: any, res) => {
    try {
      const { inspectionId, ticketNumber, registrationDate, violationsFound, violationsDescription, correctiveActions, deadline, responsible, notes, region, district } = req.body;
      if (!inspectionId || !ticketNumber) {
        return res.status(400).json({ message: 'Обязательные поля: inspectionId, ticketNumber' });
      }
      const [ticket] = await db.insert(tickets).values({
        inspectionId,
        ticketNumber,
        registrationDate: registrationDate ? new Date(registrationDate) : null,
        violationsFound: Boolean(violationsFound),
        violationsDescription,
        correctiveActions,
        deadline: deadline ? new Date(deadline) : null,
        responsible,
        notes,
        region,
        district,
        createdBy: req.user?.id,
      }).returning();
      res.json(ticket);
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ message: 'Ошибка создания талона' });
    }
  });

  app.put('/api/tickets/:id', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: tickets,
    regionColumn: tickets.region,
    districtColumn: tickets.district,
  }), async (req: any, res) => {
    try {
      const { id } = req.params;
      const { ticketNumber, registrationDate, violationsFound, violationsDescription, correctiveActions, deadline, responsible, notes } = req.body;
      const [ticket] = await db.update(tickets)
        .set({
          ticketNumber,
          registrationDate: registrationDate ? new Date(registrationDate) : null,
          violationsFound: Boolean(violationsFound),
          violationsDescription,
          correctiveActions,
          deadline: deadline ? new Date(deadline) : null,
          responsible,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, id))
        .returning();
      if (!ticket) return res.status(404).json({ message: 'Талон не найден' });
      res.json(ticket);
    } catch (error) {
      console.error('Error updating ticket:', error);
      res.status(500).json({ message: 'Ошибка обновления талона' });
    }
  });

  app.delete('/api/tickets/:id', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: tickets,
    regionColumn: tickets.region,
    districtColumn: tickets.district,
  }), async (req: any, res) => {
    try {
      const { id } = req.params;
      await db.delete(tickets).where(eq(tickets.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      res.status(500).json({ message: 'Ошибка удаления талона' });
    }
  });

  app.get('/api/admin-cases', isAuthenticated, async (req: any, res) => {
    try {
      const { article, paymentStatus, period, dateFrom, dateTo } = req.query;
      const conditions = buildRegistryFilters(
        adminCases,
        adminCases.caseDate,
        [
          adminCases.number,
          adminCases.bin,
          adminCases.iin,
          adminCases.article,
          adminCases.protocolNumber,
          adminCases.offenderName,
          adminCases.orgName,
          adminCases.offenderIin,
          adminCases.orgBin,
          adminCases.inspectorName,
        ],
        req,
      );

      const normalizeFilterValues = (value: any) => {
        if (!value || value === 'all') {
          return [];
        }
        if (Array.isArray(value)) {
          return value.filter((item) => item && item !== 'all');
        }
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item && item !== 'all');
        }
        return [];
      };

      if (article && article !== 'all') {
        conditions.push(eq(adminCases.article, article as string));
      }

      if (period && !dateFrom && !dateTo) {
        const now = new Date();
        let startDate: Date | undefined;
        if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === 'quarter') {
          const quarterStart = Math.floor(now.getMonth() / 3) * 3;
          startDate = new Date(now.getFullYear(), quarterStart, 1);
        } else if (period === 'year') {
          startDate = new Date(now.getFullYear(), 0, 1);
        }
        if (startDate) {
          conditions.push(gte(adminCases.caseDate, startDate));
          conditions.push(lte(adminCases.caseDate, now));
        }
      }

      const paymentStatusValues = normalizeFilterValues(paymentStatus);
      if (paymentStatusValues.length > 0) {
        const paymentConditions = paymentStatusValues
          .map((status) => {
            switch (status) {
              case 'voluntary':
                return eq(adminCases.finePaidVoluntary, true);
              case 'reduced':
                return eq(adminCases.finePaidReduced, true);
              case 'forced':
                return eq(adminCases.finePaidForced, true);
              case 'unpaid':
                return and(
                  or(isNull(adminCases.finePaidVoluntary), eq(adminCases.finePaidVoluntary, false)),
                  or(isNull(adminCases.finePaidReduced), eq(adminCases.finePaidReduced, false)),
                  or(isNull(adminCases.finePaidForced), eq(adminCases.finePaidForced, false)),
                );
              default:
                return undefined;
            }
          })
          .filter(Boolean);

        if (paymentConditions.length === 1) {
          conditions.push(paymentConditions[0]);
        } else if (paymentConditions.length > 1) {
          conditions.push(or(...paymentConditions));
        }
      }

      let query = db.select().from(adminCases);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const result = await query.orderBy(desc(adminCases.caseDate));
      res.json(result);
    } catch (error) {
      console.error('Error loading admin cases:', error);
      res.status(500).json({ message: 'Ошибка загрузки административных дел' });
    }
  });

  app.get('/api/admin-cases/count-by-inspections', isAuthenticated, async (req: any, res) => {
    try {
      const { inspectionIds } = req.query;
      if (!inspectionIds) {
        return res.json({});
      }
      const ids = typeof inspectionIds === 'string' ? inspectionIds.split(',') : inspectionIds;
      if (ids.length > 500) {
        return res.status(400).json({ message: 'Слишком много ID проверок (макс. 500)' });
      }
      const scopeUser = toScopeUser(req.user);
      const scopeCondition = applyScopeCondition(scopeUser, adminCases.region, adminCases.district);
      const conditions = [inArray(adminCases.inspectionId, ids)];
      if (scopeCondition) conditions.push(scopeCondition);
      const result = await db
        .select({
          inspectionId: adminCases.inspectionId,
          count: sql<number>`count(*)::int`,
        })
        .from(adminCases)
        .where(and(...conditions))
        .groupBy(adminCases.inspectionId);
      const countMap: Record<string, number> = {};
      result.forEach((r) => {
        if (r.inspectionId) countMap[r.inspectionId] = r.count;
      });
      res.json(countMap);
    } catch (error) {
      console.error('Error counting admin cases by inspections:', error);
      res.status(500).json({ message: 'Ошибка подсчёта административных дел' });
    }
  });

  app.post('/api/admin-cases', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: adminCases,
    regionColumn: adminCases.region,
    districtColumn: adminCases.district,
  }), async (req: any, res) => {
    try {
      const [adminCase] = await db.insert(adminCases).values({
        ...req.body,
      }).returning();
      res.json(adminCase);
    } catch (error) {
      console.error('Error creating admin case:', error);
      res.status(500).json({ message: 'Ошибка создания административного дела' });
    }
  });

  app.put('/api/admin-cases/:id', isAuthenticated, canWriteRegistry, buildScopeWriteCheck({
    table: adminCases,
    regionColumn: adminCases.region,
    districtColumn: adminCases.district,
  }), async (req: any, res) => {
    try {
      const [adminCase] = await db.update(adminCases)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(adminCases.id, req.params.id))
        .returning();
      if (!adminCase) {
        return res.status(404).json({ message: 'Административное дело не найдено' });
      }
      res.json(adminCase);
    } catch (error) {
      console.error('Error updating admin case:', error);
      res.status(500).json({ message: 'Ошибка обновления административного дела' });
    }
  });

  app.get('/api/reports/inspections', isAuthenticated, async (req: any, res) => {
    try {
      const { region, district, status, dateFrom, dateTo, period } = req.query;
      const scopeUser = toScopeUser(req.user);

      const allowedPeriods = ['day', 'week', 'month', 'quarter', 'year'];
      const periodValue = allowedPeriods.includes(period as string) ? (period as string) : 'month';
      const periodExpression = sql`date_trunc(${sql.raw(`'${periodValue}'`)}, ${inspections.inspectionDate})`;

      const conditions = [];
      const scopeCondition = applyScopeCondition(scopeUser, inspections.region, inspections.district);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }

      const normalizeStatus = (value: any) => {
        if (!value || value === 'all') {
          return [];
        }
        if (Array.isArray(value)) {
          return value.filter((item) => item && item !== 'all');
        }
        if (typeof value === 'string') {
          return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item && item !== 'all');
        }
        return [];
      };

      if (region && region !== 'all') {
        conditions.push(eq(inspections.region, region as string));
      }
      if (district && district !== 'all') {
        conditions.push(eq(inspections.district, district as string));
      }
      const statusValues = normalizeStatus(status);
      if (statusValues.length === 1) {
        conditions.push(eq(inspections.status, statusValues[0] as any));
      } else if (statusValues.length > 1) {
        conditions.push(inArray(inspections.status, statusValues as any[]));
      }
      if (dateFrom) {
        conditions.push(gte(inspections.inspectionDate, new Date(dateFrom as string)));
      }
      if (dateTo) {
        conditions.push(lte(inspections.inspectionDate, new Date(dateTo as string)));
      }

      let query = db.select({
        period: periodExpression,
        totalCount: sql<number>`count(*)`,
        plannedCount: sql<number>`sum(case when ${inspections.status} = 'planned' then 1 else 0 end)`,
        completedCount: sql<number>`sum(case when ${inspections.status} = 'completed' then 1 else 0 end)`,
        scheduledCount: sql<number>`sum(case when ${inspections.type} = 'scheduled' then 1 else 0 end)`,
        unscheduledCount: sql<number>`sum(case when ${inspections.type} = 'unscheduled' then 1 else 0 end)`,
        preventiveCount: sql<number>`sum(case when ${inspections.type} = 'preventive_control' then 1 else 0 end)`,
        monitoringCount: sql<number>`sum(case when ${inspections.type} = 'monitoring' then 1 else 0 end)`,
        withViolationsCount: sql<number>`sum(case when coalesce(${inspections.violationsCount}, 0) > 0 then 1 else 0 end)`,
        withPrescriptionsCount: sql<number>`sum(case when exists(select 1 from ${prescriptions} where ${prescriptions.inspectionId} = ${inspections.id}) then 1 else 0 end)`,
      }).from(inspections);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rows = await query.groupBy(periodExpression).orderBy(periodExpression);
      res.json(rows);
    } catch (error) {
      console.error('Error loading inspections report:', error);
      res.status(500).json({ message: 'Ошибка загрузки отчета по проверкам' });
    }
  });

  app.get('/api/control-supervision/reports', isAuthenticated, async (req: any, res) => {
    try {
      const { region, district, status, dateFrom, dateTo, period } = req.query;
      const scopeUser = toScopeUser(req.user);

      const allowedPeriods = ['day', 'week', 'month', 'quarter', 'year'];
      const periodValue = allowedPeriods.includes(period as string) ? (period as string) : 'month';
      const periodExpression = sql`date_trunc(${sql.raw(`'${periodValue}'`)}, ${inspections.inspectionDate})`;

      const conditions = [];
      const scopeCondition = applyScopeCondition(scopeUser, inspections.region, inspections.district);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
      if (region && region !== 'all') {
        conditions.push(eq(inspections.region, region as string));
      }
      if (district && district !== 'all') {
        conditions.push(eq(inspections.district, district as string));
      }
      if (status && status !== 'all') {
        conditions.push(eq(inspections.status, status as any));
      }
      if (dateFrom) {
        conditions.push(gte(inspections.inspectionDate, new Date(dateFrom as string)));
      }
      if (dateTo) {
        conditions.push(lte(inspections.inspectionDate, new Date(dateTo as string)));
      }

      let query = db.select({
        period: periodExpression,
        totalCount: sql<number>`count(*)`,
        plannedCount: sql<number>`sum(case when ${inspections.status} = 'planned' then 1 else 0 end)`,
        completedCount: sql<number>`sum(case when ${inspections.status} = 'completed' then 1 else 0 end)`,
      }).from(inspections);

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const rows = await query.groupBy(periodExpression).orderBy(periodExpression);
      res.json(rows);
    } catch (error) {
      console.error('Error loading inspections summary:', error);
      res.status(500).json({ message: 'Ошибка загрузки отчета по проверкам' });
    }
  });

  // API для объектов контроля с ролевой фильтрацией
  // admin - видит и редактирует всё
  // MCHS - видит всё, только чтение
  // DCHS - видит только свой регион
  // OCHS - видит только свой район
  app.get('/api/control-objects', isAuthenticated, async (req: any, res) => {
    try {
      const { region, status, format } = req.query;
      const scopeUser = toScopeUser(req.user);

      const result = await db.query.controlObjects.findMany({
        where: (fields, { and, eq }) => {
          const conditions = [];

          // Применяем ролевую фильтрацию
          const scopeCondition = applyScopeCondition(scopeUser, fields.region, fields.district);
          if (scopeCondition) {
            conditions.push(scopeCondition);
          }

          // Дополнительные фильтры из запроса
          if (region && region !== 'all') {
            conditions.push(eq(fields.region, region as string));
          }
          if (status && status !== 'all') {
            conditions.push(eq(fields.status, status as any));
          }
          return conditions.length > 0 ? and(...conditions) : undefined;
        },
        orderBy: (fields, { desc }) => [desc(fields.createdAt)]
      });

      // Формат для карты или полный формат для реестра
      if (format === 'map') {
        const objects = result.map((obj: any) => ({
          id: obj.id,
          type: 'object',
          latitude: obj.latitude ? parseFloat(obj.latitude) : null,
          longitude: obj.longitude ? parseFloat(obj.longitude) : null,
          title: obj.name,
          details: {
            category: obj.category,
            subcategory: obj.subcategory,
            address: obj.address,
            status: obj.status,
            riskLevel: obj.riskLevel,
            region: obj.region,
            district: obj.district,
          }
        }));
        return res.json(objects);
      }

      // Полный формат для реестра
      res.json(result);
    } catch (error) {
      console.error('Error loading control objects:', error);
      res.status(500).json({ message: 'Ошибка загрузки объектов контроля' });
    }
  });

  // Проверка прав на запись: MCHS только чтение, остальные могут редактировать свои данные
  const canWriteControlObjects = (req: any, res: any, next: any) => {
    const userRole = req.user?.role?.toUpperCase?.() ?? req.user?.role;
    if (userRole === 'MCHS') {
      return res.status(403).json({ message: 'У вас нет прав на редактирование. Доступ только для чтения.' });
    }
    next();
  };

  // Проверка scope при записи - DCHS может писать только в свой регион, OCHS - в свой район
  const checkWriteScope = buildScopeWriteCheck({
    table: controlObjects,
    regionColumn: controlObjects.region,
    districtColumn: controlObjects.district,
  });

  app.patch('/api/control-objects/:id', isAuthenticated, canWriteControlObjects, checkWriteScope, async (req: any, res) => {
    try {
      const { latitude, longitude } = req.body;
      const [obj] = await db.update(controlObjects)
        .set({
          latitude: latitude || null,
          longitude: longitude || null,
          updatedAt: new Date()
        })
        .where(eq(controlObjects.id, req.params.id))
        .returning();

      if (!obj) return res.status(404).json({ message: 'Объект не найден' });
      res.json(obj);
    } catch (error) {
      console.error('Error updating object coordinates:', error);
      res.status(500).json({ message: 'Ошибка обновления координат' });
    }
  });

  app.post('/api/control-objects', isAuthenticated, canWriteControlObjects, checkWriteScope, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const orgUnitId = req.user?.orgUnitId || null;

      const data = req.body;
      const result = await db.insert(controlObjects).values({
        ...data,
        orgUnitId,
        createdBy: userId,
      }).returning();

      res.json(result[0]);
    } catch (error) {
      console.error('Error creating control object:', error);
      res.status(500).json({ message: 'Ошибка создания объекта контроля' });
    }
  });

  app.put('/api/control-objects/:id', isAuthenticated, canWriteControlObjects, checkWriteScope, async (req: any, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const result = await db.update(controlObjects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(controlObjects.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ message: 'Объект не найден' });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Error updating control object:', error);
      res.status(500).json({ message: 'Ошибка обновления объекта контроля' });
    }
  });

  app.delete('/api/control-objects/:id', isAuthenticated, canWriteControlObjects, checkWriteScope, async (req: any, res) => {
    try {
      const { id } = req.params;

      await db.delete(controlObjects).where(eq(controlObjects.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting control object:', error);
      res.status(500).json({ message: 'Ошибка удаления объекта контроля' });
    }
  });

  app.get('/api/forecasts', isAuthenticated, async (req: any, res) => {
    res.json([]);
  });

  // === МОБИЛЬНЫЕ ПОЛЕВЫЕ ОТЧЕТЫ ===
  app.post('/api/field-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const reportData = JSON.parse(req.body.reportData || '{}');
      if (!req.user?.orgUnitId) {
        return res.status(400).json({ message: 'org unit required' });
      }
      const incidentData = {
        ...reportData,
        orgUnitId: req.user?.orgUnitId,
        createdBy: userId,
        dateTime: new Date(),
        objectType: '01',
        cause: '01',
        locality: 'cities'
      };
      const incident = await storage.createIncident(incidentData);
      res.json({ success: true, incidentId: incident.id });
    } catch (error) {
      console.error('Error creating field report:', error);
      res.status(500).json({ message: 'Ошибка создания полевого отчета' });
    }
  });

  // === AI Chat Integration ===
  const { registerChatRoutes } = await import('./replit_integrations/chat');
  registerChatRoutes(app);

  // === НОРМАТИВНЫЕ ДОКУМЕНТЫ ===
  const { normativeDocuments } = await import('@shared/schema');
  const { desc, asc } = await import('drizzle-orm');

  // Get all normative documents
  app.get('/api/normative-documents', async (req: any, res) => {
    try {
      const docs = await db.select().from(normativeDocuments).orderBy(asc(normativeDocuments.sortOrder), desc(normativeDocuments.createdAt));
      res.json(docs);
    } catch (error) {
      console.error('Error fetching normative documents:', error);
      res.status(500).json({ message: 'Ошибка загрузки документов' });
    }
  });

  // Create normative document (admin only)
  app.post('/api/normative-documents', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'MCHS') {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
      const [doc] = await db.insert(normativeDocuments).values({
        ...req.body,
        createdBy: req.user?.id
      }).returning();
      res.json(doc);
    } catch (error) {
      console.error('Error creating normative document:', error);
      res.status(500).json({ message: 'Ошибка создания документа' });
    }
  });

  // Update normative document (admin only)
  app.put('/api/normative-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'MCHS') {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
      const [doc] = await db.update(normativeDocuments)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(normativeDocuments.id, req.params.id))
        .returning();
      res.json(doc);
    } catch (error) {
      console.error('Error updating normative document:', error);
      res.status(500).json({ message: 'Ошибка обновления документа' });
    }
  });

  // Delete normative document (admin only)
  app.delete('/api/normative-documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'admin' && userRole !== 'MCHS') {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
      await db.delete(normativeDocuments).where(eq(normativeDocuments.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting normative document:', error);
      res.status(500).json({ message: 'Ошибка удаления документа' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
