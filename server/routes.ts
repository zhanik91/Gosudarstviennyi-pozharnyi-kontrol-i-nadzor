import type { Express } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { controlObjects } from "@shared/schema";
import { eq } from "drizzle-orm";
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
import { toScopeUser } from "./services/authz";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupLocalAuth(app);

  // === Организации ===
  app.get('/api/organizations', isAuthenticated, organizationController.getOrganizations);
  app.post('/api/organizations', isAuthenticated, organizationController.createOrganization);
  app.get('/api/organizations/:id/hierarchy', isAuthenticated, organizationController.getHierarchy);

  // === Инциденты ===
  app.get('/api/incidents/search', isAuthenticated, incidentController.searchIncidents);
  app.get('/api/incidents/:id', isAuthenticated, incidentController.getIncident);
  app.get('/api/incidents', isAuthenticated, incidentController.getIncidents);
  app.post('/api/incidents', isAuthenticated, incidentController.createIncident);
  app.put('/api/incidents/:id', isAuthenticated, incidentController.updateIncident);
  app.delete('/api/incidents/:id', isAuthenticated, incidentController.deleteIncident);

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

  // === ИНТЕРАКТИВНЫЕ КАРТЫ & Forecasts (Stub/Logic) ===
  app.get('/api/maps/data', isAuthenticated, async (req: any, res) => {
    try {
      const { region, timeRange } = req.query;
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
      
      const incidentsWithCoords = incidents
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
            district: inc.district,
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

  // API для объектов контроля
  app.get('/api/control-objects', isAuthenticated, async (req: any, res) => {
    try {
      const { region, status } = req.query;
      const result = await db.query.controlObjects.findMany({
        where: (fields, { and, eq }) => {
          const conditions = [];
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
      
      res.json(objects);
    } catch (error) {
      console.error('Error loading control objects:', error);
      res.status(500).json({ message: 'Ошибка загрузки объектов контроля' });
    }
  });

  app.post('/api/control-objects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const orgUnitId = req.user?.orgUnitId;
      
      if (!orgUnitId) {
        return res.status(400).json({ message: 'Не указано подразделение пользователя' });
      }
      
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

  app.put('/api/control-objects/:id', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/control-objects/:id', isAuthenticated, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
