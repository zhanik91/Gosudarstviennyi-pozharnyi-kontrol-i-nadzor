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

      const resolvedOrgId = orgId || req.user?.orgUnitId;
      if (!resolvedOrgId) {
        return res.status(400).json({ ok: false, msg: 'org unit required' });
      }

      const reportData = form
        ? await storage.getReportFormData({
            orgId: resolvedOrgId,
            period,
            form,
            includeChildren,
            scopeUser: toScopeUser(req.user),
          })
        : await storage.getReportData({
            orgId: resolvedOrgId,
            period,
            form,
            includeChildren,
            scopeUser: toScopeUser(req.user),
          });

      const savedForm = form && period
        ? await storage.getReportForm({ orgUnitId: resolvedOrgId, period, form })
        : undefined;

      res.json({
        ok: true,
        data: {
          ...reportData,
          savedData: savedForm?.data ?? null,
          status: savedForm?.status ?? null,
          updatedAt: savedForm?.updatedAt ?? null,
        },
      });
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

  // Сохранение отчетной формы
  async saveReport(req: Request, res: Response) {
    try {
      const orgUnits = await storage.getOrganizations();
      const orgId = req.user?.orgUnitId;
      const { form, period, data, status } = req.body || {};

      if (!orgId) {
        return res.status(400).json({ ok: false, msg: 'org unit required' });
      }

      const { assertOrgScope } = await import('../services/authz');
      try {
        assertOrgScope(orgUnits, orgId, orgId);
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      const allowedForms = new Set(['1-osp', '2-ssg', '3-spvp', '4-sovp', '5-spzs', '6-sspz', 'co']);
      if (!form || !allowedForms.has(form)) {
        return res.status(400).json({ ok: false, msg: 'invalid form' });
      }
      if (!period || !/^\d{4}-\d{2}$/.test(period)) {
        return res.status(400).json({ ok: false, msg: 'invalid period' });
      }
      if (!data || typeof data !== 'object') {
        return res.status(400).json({ ok: false, msg: 'invalid data' });
      }

      const errors = validateReportData(form, data);
      if (status === 'submitted' && errors.length > 0) {
        return res.status(400).json({ ok: false, msg: 'validation failed', errors });
      }

      const reportForm = await storage.upsertReportForm({
        orgUnitId: orgId,
        period,
        form,
        data,
        status: status === 'submitted' ? 'submitted' : 'draft',
      });

      res.json({ ok: true, data: reportForm, errors });
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ ok: false, msg: 'Failed to save report' });
    }
  }
}

export const reportController = new ReportController();

function validateReportData(form: string, data: Record<string, any>) {
  const errors: Array<{ field: string; message: string }> = [];
  const isNumber = (value: any) => typeof value === 'number' && Number.isFinite(value);

  const validateRowValues = (rowId: string, fields: string[]) => {
    const row = data[rowId];
    if (!row || typeof row !== 'object') {
      return;
    }
    fields.forEach((field) => {
      const value = row[field];
      if (!isNumber(value) || value < 0) {
        errors.push({ field: `${rowId}.${field}`, message: 'Invalid value' });
      }
    });
  };

  switch (form) {
    case '1-osp':
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ['total', 'urban', 'rural']));
      break;
    case '2-ssg':
      Object.entries(data).forEach(([rowId, value]) => {
        if (!isNumber(value) || value < 0) {
          errors.push({ field: rowId, message: 'Invalid value' });
        }
      });
      break;
    case '3-spvp':
      Object.keys(data).forEach((rowId) =>
        validateRowValues(rowId, ['fires_total', 'fires_high_risk', 'damage_total', 'damage_high_risk'])
      );
      break;
    case '4-sovp':
      Object.keys(data).forEach((rowId) =>
        validateRowValues(rowId, ['fires_total', 'damage_total', 'deaths_total', 'injuries_total'])
      );
      break;
    case '5-spzs':
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ['urban', 'rural']));
      break;
    case '6-sspz':
      Object.keys(data).forEach((rowId) =>
        validateRowValues(rowId, [
          'fires_count',
          'steppe_area',
          'damage_total',
          'people_total',
          'people_dead',
          'people_injured',
          'animals_total',
          'animals_dead',
          'animals_injured',
          'extinguished_total',
          'extinguished_area',
          'extinguished_damage',
          'garrison_people',
          'garrison_units',
          'mchs_people',
          'mchs_units',
        ])
      );
      break;
    case 'co':
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ['killed_total', 'injured_total']));
      break;
    default:
      break;
  }

  return errors;
}
