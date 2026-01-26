import type { Request, Response } from "express";
import { storage } from "../storage";
import { toScopeUser } from "../services/authz";

export class AuditController {
  async getLogs(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const filters: any = {};
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.action) filters.action = req.query.action as string;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);
      if (user) {
        filters.scopeUser = toScopeUser(user);
      }

      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  }
}

export const auditController = new AuditController();
