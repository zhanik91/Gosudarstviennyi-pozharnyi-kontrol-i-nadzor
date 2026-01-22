import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertIncidentSchema, insertIncidentVictimSchema } from "@shared/schema";
import { toScopeUser } from "../services/authz";

async function canAccessOrgUnit(user: any, orgUnitId?: string | null) {
  if (!user || !orgUnitId) return false;
  if (user.role === "MCHS") return true;
  if (user.role === "DISTRICT") return user.orgUnitId === orgUnitId;
  const hierarchy = await storage.getOrganizationHierarchy(user.orgUnitId);
  return hierarchy.some((org) => org.id === orgUnitId);
}

export class IncidentController {

  // Получить один инцидент (с жертвами)
  async getIncident(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      let user = await storage.getUser(userId);
      if (!user && req.user?.username) {
        user = await storage.getUserByUsername(req.user.username);
      }

      const incident = await storage.getIncident(req.params.id);

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Check permissions
      const canAccess = await canAccessOrgUnit(user, incident.orgUnitId);
      if (!canAccess) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const victims = await storage.getIncidentVictims(incident.id);

      res.json({ ...incident, victims });
    } catch (error) {
      console.error("Error fetching incident:", error);
      res.status(500).json({ message: "Failed to fetch incident" });
    }
  }

  // Получить список инцидентов
  async getIncidents(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      let user = await storage.getUser(userId);
      if (!user && req.user?.username) {
        user = await storage.getUserByUsername(req.user.username);
      }
      const filters: any = {};
      const scopeUser = toScopeUser(user);

      if (req.query.period) filters.period = req.query.period as string;
      if (req.query.includeSubOrgs === 'true') filters.includeSubOrgs = true;
      if (scopeUser) filters.scopeUser = scopeUser;

      if (user?.role === "MCHS" && req.query.orgUnitId) {
        filters.orgUnitId = req.query.orgUnitId as string;
      }

      const incidents = await storage.getIncidents(filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  }

  // Поиск инцидентов
  async searchIncidents(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      let user = await storage.getUser(userId);
      if (!user && req.user?.username) {
        user = await storage.getUserByUsername(req.user.username);
      }
      const filters: any = {};
      const scopeUser = toScopeUser(user);

      const { q, dateFrom, dateTo, incidentType, region, includeSubOrgs } = req.query;

      if (dateFrom) {
        filters.dateFrom = dateFrom as string;
      }
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          filters.dateTo = endDate;
        }
      }
      if (incidentType) {
        filters.incidentType = incidentType as string;
      }
      if (region) {
        filters.region = region as string;
      }

      if (includeSubOrgs === "true") {
        filters.includeSubOrgs = true;
      }

      if (scopeUser) {
        filters.scopeUser = scopeUser;
      }

      if (user?.role === "MCHS" && req.query.orgUnitId) {
        filters.orgUnitId = req.query.orgUnitId as string;
      }

      const hasSearchParams =
        Boolean(q) ||
        Boolean(dateFrom) ||
        Boolean(dateTo) ||
        Boolean(incidentType) ||
        Boolean(region);

      if (!hasSearchParams) {
        const incidents = await storage.getIncidents({
          orgUnitId: filters.orgUnitId,
          scopeUser,
        });
        res.json(incidents);
        return;
      }

      const incidents = await storage.searchIncidents((q as string) || "", filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error searching incidents:", error);
      res.status(500).json({ message: "Failed to search incidents" });
    }
  }

  // Создать инцидент
  async createIncident(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      let user = await storage.getUser(userId);
      if (!user && req.user?.username) {
        user = await storage.getUserByUsername(req.user.username);
      }
      console.log("📝 Creating incident for user:", user);
      console.log("📍 Request body region/city:", req.body.region, req.body.city);

      // Для админа используем значения по умолчанию, если организация не задана
      const orgUnitId =
        user?.role === "MCHS" && req.body.orgUnitId
          ? req.body.orgUnitId
          : user?.orgUnitId;
      if (!orgUnitId) {
        return res.status(400).json({ message: "Org unit is required for incident creation" });
      }
      const createdBy = user?.id || userId;

      // Подготавливаем данные для валидации
      const incidentData = {
        ...req.body,
        orgUnitId,
        createdBy,
        dateTime: req.body.dateTime ? new Date(req.body.dateTime) : new Date(),
        // Конвертируем числовые поля в строки для соответствия схеме
        damage: req.body.damage !== undefined ? String(req.body.damage) : "0",
        savedProperty: req.body.savedProperty !== undefined ? String(req.body.savedProperty) : "0",
        deathsTotal: req.body.deathsTotal || 0,
        injuredTotal: req.body.injuredTotal || 0,
        savedPeopleTotal: req.body.savedPeopleTotal || 0,
        // Обязательные поля для валидации с дефолтными значениями
        region: req.body.region || user?.region || 'Шымкент',
        city: req.body.city || user?.district || '',
        causeCode: req.body.causeCode || req.body.cause || '01',
        cause: req.body.cause || req.body.causeCode || '01',
        objectCode: req.body.objectCode || req.body.objectType || '01',
        objectType: req.body.objectType || req.body.objectCode || '01',
        locality: req.body.locality || 'cities',
      };

      console.log("✅ Prepared incident data:", incidentData);

      // Prepare victims data if present
      let victimsData: any[] = [];
      if (req.body.victims && Array.isArray(req.body.victims)) {
        victimsData = req.body.victims;
      }

      // Validate incident
      const validatedData = insertIncidentSchema.parse(incidentData);

      // Validate victims
      const validatedVictims = victimsData.map(v => insertIncidentVictimSchema.parse(v));

      const incident = await storage.createIncident({
        ...validatedData,
        victims: validatedVictims
      });

      // Audit Log (временно здесь, позже перенесем в middleware или сервис)
      if (userId) {
        await storage.createAuditLog({
          userId: userId,
          action: 'create',
          entityType: 'incident',
          entityId: incident.id,
          details: validatedData,
          ipAddress: req.ip,
        });
      }

      res.json(incident);
    } catch (error) {
      console.error("Error creating incident:", error);
      if (error instanceof Error) {
        res.status(400).json({
          message: `Ошибка валидации: ${error.message}`,
          details: error.cause
        });
      } else {
        res.status(500).json({ message: "Неизвестная ошибка создания происшествия" });
      }
    }
  }

  // Обновить инцидент
  async updateIncident(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      const incident = await storage.getIncident(req.params.id);

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Check permissions
      const canAccess = await canAccessOrgUnit(user, incident.orgUnitId);
      if (!canAccess) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      // Prepare victims data if present
      let victimsData: any[] | undefined = undefined;
      if (req.body.victims && Array.isArray(req.body.victims)) {
        victimsData = req.body.victims;
      }

      const updateData = insertIncidentSchema.partial().parse(req.body);
      const validatedVictims = victimsData
        ? victimsData.map(v => insertIncidentVictimSchema.parse(v))
        : undefined;

      const updatedIncident = await storage.updateIncident(req.params.id, {
        ...updateData,
        victims: validatedVictims
      });

      if (userId) {
        await storage.createAuditLog({
          userId: userId,
          action: 'update',
          entityType: 'incident',
          entityId: incident.id,
          details: updateData,
          ipAddress: req.ip,
        });
      }

      res.json(updatedIncident);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(500).json({ message: "Failed to update incident" });
    }
  }

  // Удалить инцидент
  async deleteIncident(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      const incident = await storage.getIncident(req.params.id);

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      // Check permissions
      const canAccess = await canAccessOrgUnit(user, incident.orgUnitId);
      if (!canAccess) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      await storage.deleteIncident(req.params.id);

      if (userId) {
        await storage.createAuditLog({
          userId: userId,
          action: 'delete',
          entityType: 'incident',
          entityId: incident.id,
          ipAddress: req.ip,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting incident:", error);
      res.status(500).json({ message: "Failed to delete incident" });
    }
  }
}

export const incidentController = new IncidentController();
