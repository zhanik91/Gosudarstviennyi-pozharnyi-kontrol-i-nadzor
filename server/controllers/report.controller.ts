import type { Request, Response } from "express";
import { storage } from "../storage";

export class ReportController {

  // Получение статистических отчетов с проверкой организационной области
  async getReports(req: Request, res: Response) {
    try {
      const organizations = await storage.getOrganizations();
      // Use user's ID as fallback, matching standard auth behavior
      const orgId = (req.query.orgId as string) || req.user?.id || req.user?.username;
      const includeChildren = req.query.includeChildren === 'true';
      const period = req.query.period as string;
      const form = req.query.form as string;

      // Проверка доступа к организации
      const { assertOrgScope, assertTreeAccess } = await import('../services/authz');

      try {
        // Use organizationId from the authenticated user object
        const userOrgId = req.user?.organizationId || 'mcs-rk';

        assertOrgScope(organizations, userOrgId, orgId);

        if (includeChildren) {
          assertTreeAccess(req.user?.role || 'editor');
        }
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      // Получение данных отчета
      const reportData = await storage.getReportData({
        orgId,
        period,
        form,
        includeChildren
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
      const organizations = await storage.getOrganizations();
      const orgId = (req.query.orgId as string) || req.user?.organizationId; // Improved from legacy claims.sub
      const period = req.query.period as string;

      // Проверка доступа
      const { assertOrgScope } = await import('../services/authz');

      try {
        assertOrgScope(organizations, req.user?.organizationId || 'mcs-rk', orgId);
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
