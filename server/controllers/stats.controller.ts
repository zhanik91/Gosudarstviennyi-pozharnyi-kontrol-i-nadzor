import type { Request, Response } from "express";
import { storage } from "../storage";
import { toScopeUser } from "../services/authz";

export class StatsController {
  async getStats(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
      const period = req.query.period as string;
      const stats = await storage.getIncidentStats({
        orgUnitId: user?.role === "MCHS" ? (req.query.orgUnitId as string | undefined) : user?.orgUnitId,
        period,
        scopeUser: toScopeUser(user),
      });
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  }
}

export const statsController = new StatsController();
