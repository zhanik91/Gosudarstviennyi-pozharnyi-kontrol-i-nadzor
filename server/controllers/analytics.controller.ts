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
      const region = req.query.region as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";
      const orgUnitId = user?.role === "MCHS" ? (req.query.orgUnitId as string | undefined) : user?.orgUnitId;

      const analytics = await storage.getSimpleAnalytics({
        orgUnitId,
        period,
        periodFrom,
        periodTo,
        includeSubOrgs,
        region,
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
      const region = req.query.region as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";
      const orgUnitId = user?.role === "MCHS" ? (req.query.orgUnitId as string | undefined) : user?.orgUnitId;

      const analytics = await storage.getFormAnalytics({
        orgUnitId,
        period,
        periodFrom,
        periodTo,
        includeSubOrgs,
        region,
        scopeUser,
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching form analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }

  async getAdvancedAnalytics(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const scopeUser = toScopeUser(user);
      const period = req.query.period as string | undefined;
      const region = req.query.region as string | undefined;
      const includeSubOrgs =
        req.query.includeChildren === "true" || req.query.includeSubOrgs === "true";
      const orgUnitId = user?.role === "MCHS" ? (req.query.orgUnitId as string | undefined) : user?.orgUnitId;

      const analytics = await storage.getAdvancedAnalytics({
        orgUnitId,
        period,
        includeSubOrgs,
        region,
        scopeUser,
      });

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching advanced analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  }

  async getReportFormsCharts(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const scopeUser = toScopeUser(user);
      const period = (req.query.period as string) || "2025-12";
      const region = req.query.region as string | undefined;
      
      const data = await storage.getAllRegionsData({ period, scopeUser, region });
      
      res.json({
        ok: true,
        period,
        form1: {
          regions: data.form1,
          totals: data.form1.reduce((acc, row) => ({
            fires: acc.fires + row.fires,
            deaths: acc.deaths + row.deaths,
            injured: acc.injured + row.injured,
            damage: acc.damage + row.damage,
          }), { fires: 0, deaths: 0, injured: 0, damage: 0 }),
        },
        form2: {
          regions: data.form2,
          totals: { total: data.form2.reduce((sum, row) => sum + row.total, 0) },
        },
      });
    } catch (error) {
      console.error("Error fetching report forms charts:", error);
      res.status(500).json({ message: "Failed to fetch charts data" });
    }
  }
}

export const analyticsController = new AnalyticsController();
