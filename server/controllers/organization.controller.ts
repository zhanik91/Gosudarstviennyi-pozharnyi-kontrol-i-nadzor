import type { Request, Response } from "express";
import { storage } from "../storage";
import { insertOrganizationSchema } from "@shared/schema";

export class OrganizationController {

  // Получить список организаций
  async getOrganizations(req: Request, res: Response) {
    try {
      const organizations = await storage.getOrganizations();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  }

  // Создать организацию
  async createOrganization(req: Request, res: Response) {
    try {
      const userId = req.user?.id || req.user?.username;
      const user = await storage.getUser(userId);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const orgData = insertOrganizationSchema.parse(req.body);
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
