import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./auth-local";
import adminRoutes from "./routes/admin";
import {
  insertIncidentSchema,
  insertOrganizationSchema,
  insertPackageSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Портальные маршруты - только для не-SPA страниц
  app.get('/portal', (req, res) => {
    res.render('home', {
      title: 'Портал МЧС РК',
      user: req.user
    });
  });

  // Auth middleware
  setupLocalAuth(app);

  // Подключение модульных маршрутов
  const reportsRouter = await import('./routes/reports');
  const packagesRouter = await import('./routes/packages');
  const exportRouter = await import('./routes/export');
  
  app.use(reportsRouter.default);
  app.use(packagesRouter.default);
  app.use(exportRouter.default);
  app.use('/api/admin', adminRoutes);

  // Helper function for audit logging
  const auditLog = async (req: any, action: string, objectType: string, objectId?: string, details?: any) => {
    const userId = req.user?.id || req.user?.username;
    if (userId) {
      await storage.createAuditLog({
        userId: userId,
        action,
        objectType,
        objectId,
        details,
        ipAddress: req.ip,
      });
    }
  };

  // Auth routes handled in auth-local.ts

  // Organization routes
  app.get('/api/organizations', isAuthenticated, async (req, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      
      await auditLog(req, 'create', 'organization', organization.id, orgData);
      
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.get('/api/organizations/:id/hierarchy', isAuthenticated, async (req, res) => {
    try {
      const hierarchy = await storage.getOrganizationHierarchy(req.params.id);
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching organization hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch organization hierarchy" });
    }
  });

  // Incident routes
  app.get('/api/incidents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      const filters: any = {};
      
      if (req.query.period) filters.period = req.query.period as string;
      if (req.query.includeSubOrgs === 'true') filters.includeSubOrgs = true;
      
      // Apply organization-based filtering based on user role
      if (user?.role !== 'admin' && user?.organizationId) {
        filters.organizationId = user.organizationId;
      } else if (req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
      }
      
      const incidents = await storage.getIncidents(filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.post('/api/incidents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      console.log("Creating incident for user:", user);
      console.log("Request body:", req.body);
      
      // Для админа используем значения по умолчанию, если организация не задана
      const organizationId = user?.organizationId || 'mcs-rk';
      const createdBy = user?.id || userId;

      // Подготавливаем данные для валидации с обязательными полями
      const incidentData = {
        ...req.body,
        organizationId,
        createdBy,
        dateTime: req.body.dateTime ? new Date(req.body.dateTime) : new Date(),
        damage: req.body.damage ? parseFloat(req.body.damage) : 0,
        savedProperty: req.body.savedProperty ? parseFloat(req.body.savedProperty) : 0,
        deathsTotal: req.body.deathsTotal || 0,
        injuredTotal: req.body.injuredTotal || 0,
        savedPeopleTotal: req.body.savedPeopleTotal || 0,
        // Обязательные поля для валидации
        region: req.body.region || user?.region || 'Шымкент',
        city: req.body.city || user?.district || '',
        objectType: req.body.objectType || '01',
        cause: req.body.cause || '01',
        locality: req.body.locality || 'cities'
      };
      
      console.log("Данные для валидации:", incidentData);
      
      const validatedData = insertIncidentSchema.parse(incidentData);
      
      console.log("✅ Валидация прошла успешно, создаем происшествие...");
      
      const incident = await storage.createIncident(validatedData);
      
      await auditLog(req, 'create', 'incident', incident.id, validatedData);
      
      res.json(incident);
    } catch (error) {
      console.error("❌ Полная ошибка создания происшествия:", error);
      console.error("❌ Тип ошибки:", typeof error);
      console.error("❌ Стек ошибки:", error instanceof Error ? error.stack : 'Нет стека');
      
      if (error instanceof Error) {
        res.status(400).json({ 
          message: `Ошибка валидации: ${error.message}`,
          details: error.cause || error.stack?.split('\n').slice(0, 3).join('\n')
        });
      } else {
        res.status(500).json({ message: "Неизвестная ошибка создания происшествия" });
      }
    }
  });

  app.put('/api/incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      const incident = await storage.getIncident(req.params.id);
      
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Check permissions - users can only edit their own organization's incidents
      if (user?.role !== 'admin' && incident.organizationId !== user?.organizationId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const updateData = insertIncidentSchema.partial().parse(req.body);
      const updatedIncident = await storage.updateIncident(req.params.id, updateData);
      
      await auditLog(req, 'update', 'incident', incident.id, updateData);
      
      res.json(updatedIncident);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  app.delete('/api/incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      const incident = await storage.getIncident(req.params.id);
      
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      
      // Check permissions
      if (user?.role !== 'admin' && incident.organizationId !== user?.organizationId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      await storage.deleteIncident(req.params.id);
      
      await auditLog(req, 'delete', 'incident', incident.id);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ message: "Failed to delete incident" });
    }
  });

  // Package routes
  app.get('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const filters: any = {};
      
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.period) filters.period = req.query.period as string;
      
      // Apply organization-based filtering
      if (user?.role !== 'admin' && user?.organizationId) {
        filters.organizationId = user.organizationId;
      } else if (req.query.organizationId) {
        filters.organizationId = req.query.organizationId as string;
      }
      
      const packages = await storage.getPackages(filters);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must be assigned to an organization" });
      }

      const packageData = insertPackageSchema.parse({
        ...req.body,
        organizationId: user.organizationId,
      });
      
      const pkg = await storage.createPackage(packageData);
      
      await auditLog(req, 'create', 'package', pkg.id, packageData);
      
      res.json(pkg);
    } catch (error) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  app.put('/api/packages/:id/submit', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const pkg = await storage.getPackage(req.params.id);
      
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (pkg.organizationId !== user?.organizationId && user?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const updatedPackage = await storage.updatePackage(req.params.id, {
        status: 'submitted',
        submittedBy: user.id,
        submittedAt: new Date(),
      });
      
      await auditLog(req, 'submit', 'package', pkg.id);
      
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error submitting package:", error);
      res.status(500).json({ message: "Failed to submit package" });
    }
  });

  app.put('/api/packages/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['reviewer', 'approver', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const updatedPackage = await storage.updatePackage(req.params.id, {
        status: 'approved',
        approvedBy: user!.id,
        approvedAt: new Date(),
      });
      
      await auditLog(req, 'approve', 'package', pkg.id);
      
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error approving package:", error);
      res.status(500).json({ message: "Failed to approve package" });
    }
  });

  app.put('/api/packages/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!['reviewer', 'approver', 'admin'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      const { reason } = req.body;
      
      const updatedPackage = await storage.updatePackage(req.params.id, {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: user!.id,
        reviewedAt: new Date(),
      });
      
      await auditLog(req, 'reject', 'package', pkg.id, { reason });
      
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error rejecting package:", error);
      res.status(500).json({ message: "Failed to reject package" });
    }
  });

  // Statistics routes
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must be assigned to an organization" });
      }
      
      const period = req.query.period as string;
      const stats = await storage.getIncidentStats(user.organizationId, period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Audit log routes
  app.get('/api/audit-logs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const filters: any = {};
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.action) filters.action = req.query.action as string;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // User management routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/organizations', isAuthenticated, async (req: any, res) => {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  // Регистрируем bulk операции
  const { registerBulkIncidentRoutes } = await import('./routes/incidents-bulk');
  registerBulkIncidentRoutes(app);

  // Document management routes with object storage
  const { DocumentStorageService, ObjectNotFoundError } = await import('./objectStorage');
  const documentStorageService = new DocumentStorageService();

  // Get document upload URL
  app.post('/api/documents/upload-url', isAuthenticated, async (req: any, res) => {
    try {
      const { fileName, documentType } = req.body;
      const uploadURL = await documentStorageService.getDocumentUploadURL(documentType || 'reports');
      
      res.json({ 
        uploadURL,
        fileName,
        documentType 
      });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Create document record
  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      
      const documentData = {
        ...req.body,
        organizationId: user?.organizationId || 'mcs-rk',
        createdBy: userId,
      };
      
      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Get documents
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      if (req.query.documentType) filters.documentType = req.query.documentType;
      if (req.query.period) filters.period = req.query.period;
      if (req.query.status) filters.status = req.query.status;
      
      // Apply organization filtering
      if (user?.role !== 'admin' && user?.organizationId) {
        filters.organizationId = user.organizationId;
      }
      
      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Serve document files
  app.get('/documents/:documentPath(*)', isAuthenticated, async (req, res) => {
    try {
      const documentFile = await documentStorageService.getDocumentFile(req.path);
      await documentStorageService.downloadObject(documentFile, res);
    } catch (error) {
      console.error("Error serving document:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public objects
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    try {
      const file = await documentStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      await documentStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // === CRM РАСШИРЕНИЯ - ДОКУМЕНТООБОРОТ ===
  
  // Получение документов с фильтрацией
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { search, type, status, period } = req.query;
      const filters = { search, type, status, period };
      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Ошибка загрузки документов' });
    }
  });

  // Загрузка документов с файлами
  app.post('/api/documents/upload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      // В реальности здесь должна быть обработка multipart/form-data
      const documentData = {
        ...req.body,
        createdBy: userId,
        status: 'draft',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ message: 'Ошибка загрузки документа' });
    }
  });

  // Обновление статуса документа
  app.put('/api/documents/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const document = await storage.updateDocumentStatus(req.params.id, status);
      res.json(document);
    } catch (error) {
      console.error('Error updating document status:', error);
      res.status(500).json({ message: 'Ошибка обновления статуса' });
    }
  });

  // Удаление документа
  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ message: 'Ошибка удаления документа' });
    }
  });

  // === СИСТЕМА УВЕДОМЛЕНИЙ ===
  
  // Получение уведомлений
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

  // Создание уведомления
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

  // === СИСТЕМА WORKFLOW СОГЛАСОВАНИЙ ===
  
  // Получение процессов согласования
  app.get('/api/workflows', isAuthenticated, async (req: any, res) => {
    try {
      // Временная заглушка с примерными данными
      const workflows = [
        {
          id: 'workflow-1',
          title: 'Согласование отчета 1-ОСП за январь 2024',
          documentId: 'doc-001',
          documentType: '1-ОСП',
          currentLevel: 1,
          maxLevel: 3,
          status: 'pending',
          approvers: [
            {
              level: 1,
              userId: 'user-1',
              userName: 'Инспектор МЧС',
              status: 'pending'
            },
            {
              level: 2, 
              userId: 'user-2',
              userName: 'Начальник отдела',
              status: 'pending'
            },
            {
              level: 3,
              userId: 'user-3', 
              userName: 'Руководитель департамента',
              status: 'pending'
            }
          ],
          createdBy: 'system',
          createdAt: new Date()
        }
      ];
      
      res.json(workflows);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      res.status(500).json({ message: 'Ошибка загрузки процессов согласования' });
    }
  });

  // Утверждение в workflow
  app.post('/api/workflows/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const { comment } = req.body;
      // В реальности здесь логика обновления workflow
      res.json({ success: true, message: 'Документ утвержден' });
    } catch (error) {
      console.error('Error approving workflow:', error);
      res.status(500).json({ message: 'Ошибка утверждения' });
    }
  });

  // Отклонение в workflow
  app.post('/api/workflows/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const { comment } = req.body;
      // В реальности здесь логика отклонения workflow
      res.json({ success: true, message: 'Документ отклонен' });
    } catch (error) {
      console.error('Error rejecting workflow:', error);
      res.status(500).json({ message: 'Ошибка отклонения' });
    }
  });

  // === ИНТЕРАКТИВНЫЕ КАРТЫ ===
  
  // Данные для карт
  app.get('/api/maps/data', isAuthenticated, async (req: any, res) => {
    try {
      const { region, timeRange, view } = req.query;
      
      // Получаем реальные данные из базы
      const analyticsData = await storage.getAdvancedAnalytics({ period: timeRange, organizationId: region });
      
      // Формируем данные для карт
      const mapData = {
        regions: analyticsData.regionStats?.map((stat: any) => ({
          name: stat.region,
          incidents: Number(stat.count) || 0,
          deaths: Number(stat.deaths) || 0,
          damage: Number(stat.damage) || 0,
          riskLevel: Number(stat.count) > 10 ? 'high' : Number(stat.count) > 5 ? 'medium' : 'low',
          coordinates: [43.2220, 76.8512], // Примерные координаты для Алматы
          population: 2000000,
          objects: 1000
        })) || [],
        incidents: [], // Можно добавить конкретные инциденты с координатами
        heatmapData: [],
        trends: analyticsData.monthlyStats?.map((stat: any) => ({
          period: stat.month,
          incidents: Number(stat.count) || 0,
          prediction: Math.round((Number(stat.count) || 0) * 1.1) // Простой прогноз +10%
        })) || []
      };
      
      res.json(mapData);
    } catch (error) {
      console.error('Error fetching map data:', error);
      res.status(500).json({ message: 'Ошибка загрузки данных карты' });
    }
  });

  // Прогнозы рисков
  app.get('/api/forecasts', isAuthenticated, async (req: any, res) => {
    try {
      // Примерные прогнозы на основе анализа данных
      const forecasts = [
        {
          region: 'Алматинская область',
          riskLevel: 'high',
          factors: ['Повышенная пожароопасность', 'Сухая погода', 'Ветреная погода'],
          recommendation: 'Усилить патрулирование лесных зон, проверить готовность пожарных расчетов',
          probability: 75
        },
        {
          region: 'Астана',
          riskLevel: 'medium', 
          factors: ['Строительные работы', 'Низкие температуры'],
          recommendation: 'Контроль отопительных систем, проверка электропроводки',
          probability: 45
        },
        {
          region: 'Карагандинская область',
          riskLevel: 'critical',
          factors: ['Промышленные объекты', 'Горнодобыча', 'Техногенные факторы'],
          recommendation: 'Срочная проверка промышленных объектов, усиление дежурства',
          probability: 85
        }
      ];
      
      res.json(forecasts);
    } catch (error) {
      console.error('Error fetching forecasts:', error);
      res.status(500).json({ message: 'Ошибка загрузки прогнозов' });
    }
  });

  // === МОБИЛЬНЫЕ ПОЛЕВЫЕ ОТЧЕТЫ ===
  
  // Создание полевого отчета
  app.post('/api/field-reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.username;
      
      // Обработка multipart формы с файлами (в реальности нужен multer или similar)
      const reportData = JSON.parse(req.body.reportData || '{}');
      
      // Создаем инцидент на основе полевого отчета
      const incidentData = {
        ...reportData,
        organizationId: req.user?.organizationId || 'field-report',
        createdBy: userId,
        dateTime: new Date(),
        region: req.user?.region || 'Не указан',
        city: req.user?.district || 'Не указан',
        address: reportData.location?.address || '',
        coordinates: reportData.location?.coordinates,
        incidentType: reportData.incidentType,
        description: reportData.description,
        damage: reportData.damage?.estimated || 0,
        deathsTotal: reportData.casualties?.deaths || 0,
        injuredTotal: reportData.casualties?.injured || 0,
        savedPeopleTotal: reportData.casualties?.evacuated || 0,
        // Обязательные поля
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

  const httpServer = createServer(app);
  return httpServer;
}
