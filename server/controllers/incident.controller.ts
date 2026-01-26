import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertIncidentSchema, insertIncidentVictimSchema } from "@shared/schema";
import { toScopeUser } from "../services/authz";
import { ZodError } from "zod";

async function canAccessOrgUnit(user: any, orgUnitId?: string | null) {
  if (!user || !orgUnitId) return false;
  if (user.role === "MCHS") return true;
  if (user.role === "DISTRICT") return user.orgUnitId === orgUnitId;
  const hierarchy = await storage.getOrganizationHierarchy(user.orgUnitId);
  return hierarchy.some((org) => org.id === orgUnitId);
}

function getIncidentSchemaMismatchMessage() {
  const missingColumns = storage.getMissingIncidentColumns?.() ?? [];
  if (missingColumns.length === 0) return null;
  return `DB schema mismatch: missing columns ${missingColumns.join(", ")}`;
}

const parseDecimalString = (value: unknown, fallback = "0") => {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = typeof value === "string" ? value.replace(",", ".") : String(value);
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? fallback : parsed.toString();
};

const parseOptionalDecimalString = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = typeof value === "string" ? value.replace(",", ".") : String(value);
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? undefined : parsed.toString();
};

const parseInteger = (value: unknown, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseOptionalInteger = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseJsonField = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn("Invalid JSON payload:", error);
      return undefined;
    }
  }
  if (typeof value === "object") return value;
  return undefined;
};

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
      const schemaMessage = getIncidentSchemaMismatchMessage();
      res.status(500).json({ message: schemaMessage ?? "Failed to fetch incident" });
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
      const limit = Number.parseInt(req.query.limit as string, 10);
      const offset = Number.parseInt(req.query.offset as string, 10);
      if (!Number.isNaN(limit)) {
        filters.limit = Math.max(1, limit);
        filters.offset = Number.isNaN(offset) ? 0 : Math.max(0, offset);
      }

      if (user?.role === "MCHS" && req.query.orgUnitId) {
        filters.orgUnitId = req.query.orgUnitId as string;
      }

      const incidents = await storage.getIncidents(filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      const schemaMessage = getIncidentSchemaMismatchMessage();
      res.status(500).json({ message: schemaMessage ?? "Failed to fetch incidents" });
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
      const limit = Number.parseInt(req.query.limit as string, 10);
      const offset = Number.parseInt(req.query.offset as string, 10);

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

      if (!Number.isNaN(limit)) {
        filters.limit = Math.max(1, limit);
        filters.offset = Number.isNaN(offset) ? 0 : Math.max(0, offset);
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
          limit: filters.limit,
          offset: filters.offset,
        });
        res.json(incidents);
        return;
      }

      const incidents = await storage.searchIncidents((q as string) || "", filters);
      res.json(incidents);
    } catch (error) {
      console.error("Error searching incidents:", error);
      const schemaMessage = getIncidentSchemaMismatchMessage();
      res.status(500).json({ message: schemaMessage ?? "Failed to search incidents" });
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

      // Для админа/MCHS используем значения по умолчанию, если организация не задана
      let orgUnitId =
        user?.role === "MCHS" || user?.role === "admin"
          ? req.body.orgUnitId || user?.orgUnitId
          : user?.orgUnitId;
      
      // Если нет orgUnitId, пытаемся найти или создать дефолтную организацию
      if (!orgUnitId && (user?.role === "admin" || user?.role === "MCHS")) {
        const orgs = await storage.getOrganizations();
        if (orgs.length > 0) {
          orgUnitId = orgs[0].id;
        } else {
          // Создаём дефолтную организацию МЧС
          const defaultOrg = await storage.createOrganization({
            name: "МЧС Республики Казахстан",
            type: "MCHS",
            parentId: null,
            regionName: "",
            unitName: "",
          });
          orgUnitId = defaultOrg.id;
        }
      }
      
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
        damage: parseDecimalString(req.body.damage),
        savedProperty: parseDecimalString(req.body.savedProperty),
        steppeArea: parseDecimalString(req.body.steppeArea),
        steppeDamage: parseDecimalString(req.body.steppeDamage),
        steppeExtinguishedArea: parseDecimalString(req.body.steppeExtinguishedArea),
        steppeExtinguishedDamage: parseDecimalString(req.body.steppeExtinguishedDamage),
        deathsTotal: parseInteger(req.body.deathsTotal),
        deathsChildren: parseInteger(req.body.deathsChildren),
        deathsDrunk: parseInteger(req.body.deathsDrunk),
        deathsCOTotal: parseInteger(req.body.deathsCOTotal),
        deathsCOChildren: parseInteger(req.body.deathsCOChildren),
        injuredTotal: parseInteger(req.body.injuredTotal),
        injuredChildren: parseInteger(req.body.injuredChildren),
        injuredCOTotal: parseInteger(req.body.injuredCOTotal),
        injuredCOChildren: parseInteger(req.body.injuredCOChildren),
        savedPeopleTotal: parseInteger(req.body.savedPeopleTotal),
        savedPeopleChildren: parseInteger(req.body.savedPeopleChildren),
        steppePeopleTotal: parseInteger(req.body.steppePeopleTotal),
        steppePeopleDead: parseInteger(req.body.steppePeopleDead),
        steppePeopleInjured: parseInteger(req.body.steppePeopleInjured),
        steppeAnimalsTotal: parseInteger(req.body.steppeAnimalsTotal),
        steppeAnimalsDead: parseInteger(req.body.steppeAnimalsDead),
        steppeAnimalsInjured: parseInteger(req.body.steppeAnimalsInjured),
        steppeExtinguishedTotal: parseInteger(req.body.steppeExtinguishedTotal),
        steppeGarrisonPeople: parseInteger(req.body.steppeGarrisonPeople),
        steppeGarrisonUnits: parseInteger(req.body.steppeGarrisonUnits),
        steppeMchsPeople: parseInteger(req.body.steppeMchsPeople),
        steppeMchsUnits: parseInteger(req.body.steppeMchsUnits),
        floor: parseOptionalInteger(req.body.floor),
        totalFloors: parseOptionalInteger(req.body.totalFloors),
        buildingDetails: parseJsonField(req.body.buildingDetails),
        livestockLost: parseJsonField(req.body.livestockLost),
        destroyedItems: parseJsonField(req.body.destroyedItems),
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
      if (error instanceof ZodError) {
        res.status(400).json({
          message: `Ошибка валидации: ${error.message}`,
          details: error.cause
        });
        return;
      }
      const schemaMessage = getIncidentSchemaMismatchMessage();
      res.status(500).json({ message: schemaMessage ?? "Неизвестная ошибка создания происшествия" });
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

      const updatePayload = {
        ...req.body,
        dateTime: req.body.dateTime ? new Date(req.body.dateTime) : undefined,
        damage: parseOptionalDecimalString(req.body.damage),
        savedProperty: parseOptionalDecimalString(req.body.savedProperty),
        steppeArea: parseOptionalDecimalString(req.body.steppeArea),
        steppeDamage: parseOptionalDecimalString(req.body.steppeDamage),
        steppeExtinguishedArea: parseOptionalDecimalString(req.body.steppeExtinguishedArea),
        steppeExtinguishedDamage: parseOptionalDecimalString(req.body.steppeExtinguishedDamage),
        deathsTotal: parseOptionalInteger(req.body.deathsTotal),
        deathsChildren: parseOptionalInteger(req.body.deathsChildren),
        deathsDrunk: parseOptionalInteger(req.body.deathsDrunk),
        deathsCOTotal: parseOptionalInteger(req.body.deathsCOTotal),
        deathsCOChildren: parseOptionalInteger(req.body.deathsCOChildren),
        injuredTotal: parseOptionalInteger(req.body.injuredTotal),
        injuredChildren: parseOptionalInteger(req.body.injuredChildren),
        injuredCOTotal: parseOptionalInteger(req.body.injuredCOTotal),
        injuredCOChildren: parseOptionalInteger(req.body.injuredCOChildren),
        savedPeopleTotal: parseOptionalInteger(req.body.savedPeopleTotal),
        savedPeopleChildren: parseOptionalInteger(req.body.savedPeopleChildren),
        steppePeopleTotal: parseOptionalInteger(req.body.steppePeopleTotal),
        steppePeopleDead: parseOptionalInteger(req.body.steppePeopleDead),
        steppePeopleInjured: parseOptionalInteger(req.body.steppePeopleInjured),
        steppeAnimalsTotal: parseOptionalInteger(req.body.steppeAnimalsTotal),
        steppeAnimalsDead: parseOptionalInteger(req.body.steppeAnimalsDead),
        steppeAnimalsInjured: parseOptionalInteger(req.body.steppeAnimalsInjured),
        steppeExtinguishedTotal: parseOptionalInteger(req.body.steppeExtinguishedTotal),
        steppeGarrisonPeople: parseOptionalInteger(req.body.steppeGarrisonPeople),
        steppeGarrisonUnits: parseOptionalInteger(req.body.steppeGarrisonUnits),
        steppeMchsPeople: parseOptionalInteger(req.body.steppeMchsPeople),
        steppeMchsUnits: parseOptionalInteger(req.body.steppeMchsUnits),
        floor: parseOptionalInteger(req.body.floor),
        totalFloors: parseOptionalInteger(req.body.totalFloors),
        buildingDetails: parseJsonField(req.body.buildingDetails),
        livestockLost: parseJsonField(req.body.livestockLost),
        destroyedItems: parseJsonField(req.body.destroyedItems),
      };
      const updateData = insertIncidentSchema.partial().parse(updatePayload);
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
      const schemaMessage = getIncidentSchemaMismatchMessage();
      res.status(500).json({ message: schemaMessage ?? "Failed to update incident" });
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
      const schemaMessage = getIncidentSchemaMismatchMessage();
      res.status(500).json({ message: schemaMessage ?? "Failed to delete incident" });
    }
  }
}

export const incidentController = new IncidentController();
