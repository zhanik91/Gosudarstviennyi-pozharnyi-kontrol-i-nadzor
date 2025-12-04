import type { Request, Response } from "express";
import { storage } from "../storage";

export class StatsController {
  async getStats(req: Request, res: Response) {
    try {
      const user = await storage.getUser(req.user?.id || req.user?.username);
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
  }
}

export const statsController = new StatsController();
