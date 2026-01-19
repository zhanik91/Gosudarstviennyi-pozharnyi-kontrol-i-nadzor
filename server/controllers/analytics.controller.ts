import type { Request, Response } from "express";
import { storage } from "../storage";
import { toScopeUser } from "../services/authz";

export class AnalyticsController {
  async getSimpleAnalytics(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const scopeUser = toScopeUser(user);
      const period = req.query.period as string | undefined;
      const periodFrom = req.query.periodFrom as string | undefined;
      const periodTo = req.query.periodTo as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";
      const orgUnitId = user?.role === "MCHS" ? (req.query.orgUnitId as string | undefined) : user?.orgUnitId;

      const analytics = await storage.getSimpleAnalytics({
        orgUnitId,
        period,
        periodFrom,
        periodTo,
        includeSubOrgs,
        scopeUser,
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
      const scopeUser = toScopeUser(user);
      const period = req.query.period as string | undefined;
      const periodFrom = req.query.periodFrom as string | undefined;
      const periodTo = req.query.periodTo as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";
      const orgUnitId = user?.role === "MCHS" ? (req.query.orgUnitId as string | undefined) : user?.orgUnitId;

      const analytics = await storage.getFormAnalytics({
        orgUnitId,
        period,
        periodFrom,
        periodTo,
        includeSubOrgs,
        scopeUser,
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching form analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }
}

export const analyticsController = new AnalyticsController();
