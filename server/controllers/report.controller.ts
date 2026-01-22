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
      const includeChildren = req.query.includeChildren === 'true';

      // Проверка доступа
      const { assertOrgScope, assertTreeAccess } = await import('../services/authz');

      try {
        if (!req.user?.orgUnitId) {
          return res.status(400).json({ ok: false, msg: 'org unit required' });
        }
        assertOrgScope(orgUnits, req.user?.orgUnitId, orgId);
        if (includeChildren) {
          assertTreeAccess(req.user?.role || 'DISTRICT');
        }
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      const validationErrors = await storage.validateReports(orgId, period, includeChildren);
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
  const getValue = (rowId: string, field: string = 'total'): number => {
    return Number(data[rowId]?.[field] || 0);
  };

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

  // Helper to sum multiple row/field values
  const sumRows = (rowIds: string[], field: string = 'total'): number => {
    return rowIds.reduce((sum, id) => sum + getValue(id, field), 0);
  };

  switch (form) {
    case '1-osp':
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ['total', 'urban', 'rural']));

      // Validation Logic: Total Deaths (3) must be >= Children (3.1) and Intoxicated (3.2)
      if (getValue('3') < getValue('3.1')) {
        errors.push({ field: '3.total', message: 'Общее число погибших меньше числа погибших детей' });
      }
      if (getValue('3') < getValue('3.2')) {
        errors.push({ field: '3.total', message: 'Общее число погибших меньше числа погибших в нетрезвом виде' });
      }
      // Note: Strict equality 3 = 3.1 + 3.2 is NOT enforced because sober adults exist.

      // Injured (5) >= Children (5.1)
      if (getValue('5') < getValue('5.1')) {
        errors.push({ field: '5.total', message: 'Общее число травмированных меньше числа травмированных детей' });
      }
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
      // Validation: Total Dead (2) should match breakdowns if exhaustive
      // Assuming 2 = 2.1 (Men) + 2.2 (Women) + 2.3 (Children) as implied by compliance notes
      const deadTotal = getValue('2', 'urban') + getValue('2', 'rural');
      const men = getValue('2.1', 'urban') + getValue('2.1', 'rural');
      const women = getValue('2.2', 'urban') + getValue('2.2', 'rural');
      const children = getValue('2.3', 'urban') + getValue('2.3', 'rural');

      if (deadTotal !== men + women + children) {
         // Only flag if non-zero to avoid noise on empty forms, but strictly if data exists
         if (deadTotal > 0) {
             errors.push({ field: '2.total', message: 'Сумма погибших (мужчин, женщин, детей) не совпадает с общим итогом (стр. 2)' });
         }
      }
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

    case 'co': // Form 7-CO
      Object.keys(data).forEach((rowId) => validateRowValues(rowId, ['killed_total', 'injured_total']));

      // Row 5: Dead by object (5.1 - 5.11)
      const row5Total = getValue('5', 'killed_total');
      const row5Sum = sumRows(['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '5.10', '5.11'], 'killed_total');
      if (row5Total !== row5Sum) {
         errors.push({ field: '5.killed_total', message: `Сумма по объектам (${row5Sum}) не равна итогу (стр. 5: ${row5Total})` });
      }

      // Row 6: Dead by place (6.1 - 6.15)
      const row6Total = getValue('6', 'killed_total');
      const row6Sum = sumRows(['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '6.10', '6.11', '6.12', '6.13', '6.14', '6.15'], 'killed_total');
      if (row6Total !== row6Sum) {
         errors.push({ field: '6.killed_total', message: `Сумма по местам (${row6Sum}) не равна итогу (стр. 6: ${row6Total})` });
      }

      // Row 15: Injured by object (15.1 - 15.11)
      const row15Total = getValue('15', 'injured_total');
      const row15Sum = sumRows(['15.1', '15.2', '15.3', '15.4', '15.5', '15.6', '15.7', '15.8', '15.9', '15.10', '15.11'], 'injured_total');
      if (row15Total !== row15Sum) {
         errors.push({ field: '15.injured_total', message: `Сумма по объектам (${row15Sum}) не равна итогу (стр. 15: ${row15Total})` });
      }

      // Row 16: Injured by place (16.1 - 16.15)
      const row16Total = getValue('16', 'injured_total');
      const row16Sum = sumRows(['16.1', '16.2', '16.3', '16.4', '16.5', '16.6', '16.7', '16.8', '16.9', '16.10', '16.11', '16.12', '16.13', '16.14', '16.15'], 'injured_total');
      if (row16Total !== row16Sum) {
         errors.push({ field: '16.injured_total', message: `Сумма по местам (${row16Sum}) не равна итогу (стр. 16: ${row16Total})` });
      }
      break;

    default:
      break;
  }

  return errors;
}
