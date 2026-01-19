import type { Request, Response } from "express";
import { storage } from "../storage";
import { toScopeUser } from "../services/authz";

export class ReportController {

  // Получение статистических отчетов с проверкой организационной области
  async getReports(req: Request, res: Response) {
    try {
      const orgUnits = await storage.getOrganizations();
      const orgId = (req.query.orgId as string) || req.user?.orgUnitId;
      const includeChildren = req.query.includeChildren === 'true';
      const period = req.query.period as string;
      const form = req.query.form as string;

      // Проверка доступа к организации
      const { assertOrgScope, assertTreeAccess } = await import('../services/authz');

      try {
        // Use orgUnitId from the authenticated user object
        const userOrgId = req.user?.orgUnitId;
        if (!userOrgId) {
          return res.status(400).json({ ok: false, msg: 'org unit required' });
        }
        const resolvedOrgId = orgId || userOrgId;
        assertOrgScope(orgUnits, userOrgId, resolvedOrgId);

        if (includeChildren) {
          assertTreeAccess(req.user?.role || 'DISTRICT');
        }
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      // Получение данных отчета
      const reportData = await storage.getReportData({
        orgId: orgId || req.user?.orgUnitId,
        period,
        form,
        includeChildren,
        scopeUser: toScopeUser(req.user),
      });

      res.json({ ok: true, data: reportData });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ ok: false, msg: 'Internal server error' });
    }
  }

  // Получение статистики дашборда
  async getDashboardStats(req: Request, res: Response) {
    try {
      const stats = {
        incidents: await storage.getIncidentsCount(),
        objects: await storage.getObjectsCount(),
        reports: await storage.getReportsCount(),
        users: await storage.getUsersCount()
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ ok: false, msg: 'Failed to fetch statistics' });
    }
  }

  // Валидация отчетов
  async validateReports(req: Request, res: Response) {
    try {
      const orgUnits = await storage.getOrganizations();
      const orgId = (req.query.orgId as string) || req.user?.orgUnitId;
      const period = req.query.period as string;

      // Проверка доступа
      const { assertOrgScope } = await import('../services/authz');

      try {
        if (!req.user?.orgUnitId) {
          return res.status(400).json({ ok: false, msg: 'org unit required' });
        }
        assertOrgScope(orgUnits, req.user?.orgUnitId, orgId);
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      const validationErrors = await storage.validateReports(orgId, period);
      res.json({ ok: true, errors: validationErrors });
    } catch (error) {
      console.error('Error validating reports:', error);
      res.status(500).json({ ok: false, msg: 'Validation failed' });
    }
  }
}

export const reportController = new ReportController();
