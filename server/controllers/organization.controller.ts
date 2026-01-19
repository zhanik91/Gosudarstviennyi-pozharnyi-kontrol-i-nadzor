import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertOrgUnitSchema } from "@shared/schema";

export class OrganizationController {

  // Получить список организаций
  async getOrganizations(req: Request, res: Response) {
    try {
      const orgUnits = await storage.getOrganizations();
      res.json(orgUnits);
    } catch (error) {
      console.error("Error fetching orgUnits:", error);
      res.status(500).json({ message: "Failed to fetch orgUnits" });
    }
  }

  // Создать организацию
  async createOrganization(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      if (user?.role !== 'MCHS') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const orgData = insertOrgUnitSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);

      // Audit log
      if (userId) {
        await storage.createAuditLog({
          userId: userId,
          action: 'create',
          entityType: 'organization',
          entityId: organization.id,
          details: orgData,
          ipAddress: req.ip,
        });
      }

      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  }

  // Получить иерархию
  async getHierarchy(req: Request, res: Response) {
    try {
      const hierarchy = await storage.getOrganizationHierarchy(req.params.id);
      res.json(hierarchy);
    } catch (error) {
      console.error("Error fetching organization hierarchy:", error);
      res.status(500).json({ message: "Failed to fetch organization hierarchy" });
    }
  }
}

export const organizationController = new OrganizationController();
