import type { Request, Response } from "express";
import { storage } from "../storage";

export class AnalyticsController {
  async getSimpleAnalytics(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must be assigned to an organization" });
      }

      const period = req.query.period as string | undefined;
      const periodFrom = req.query.periodFrom as string | undefined;
      const periodTo = req.query.periodTo as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";

      const analytics = await storage.getSimpleAnalytics({
        organizationId: user.organizationId,
        period,
        periodFrom,
        periodTo,
        includeSubOrgs,
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching simple analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }

  async getFormAnalytics(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      if (!user?.organizationId) {
        return res.status(400).json({ message: "User must be assigned to an organization" });
      }

      const period = req.query.period as string | undefined;
      const periodFrom = req.query.periodFrom as string | undefined;
      const periodTo = req.query.periodTo as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";

      const analytics = await storage.getFormAnalytics({
        organizationId: user.organizationId,
        period,
        periodFrom,
        periodTo,
        includeSubOrgs,
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching form analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }
}

export const analyticsController = new AnalyticsController();
