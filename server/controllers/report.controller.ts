import type { Request, Response } from "express";
import { storage } from "../storage";
import { toScopeUser } from "../services/authz";
import {
  FIRE_CAUSES,
  FORM_1_OSP_ROWS,
  FORM_4_SOVP_ROWS,
  FORM_5_ROWS,
  FORM_6_IGNITIONS_ROWS,
  FORM_6_STEPPE_FIRES_ROWS,
  FORM_7_CO_ROWS,
  NON_FIRE_CASES,
} from "@shared/fire-forms-data";
import { validateReportData } from "../validators/report-validation";

export class ReportController {

  // Получение статистических отчетов с проверкой организационной области
  async getReports(req: Request, res: Response) {
    try {
      const orgUnits = await storage.getOrganizations();
      const orgId = (req.query.orgId as string) || req.user?.orgUnitId;
      const includeChildren = req.query.includeChildren === 'true';
      const period = req.query.period as string;
      const form = req.query.form as string;
      const region = req.query.region as string | undefined;

      if (!form) {
        return res.status(400).json({ ok: false, msg: "form required" });
      }

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

      const reportData = await storage.getReportFormData({
        orgId: resolvedOrgId,
        period,
        form,
        region,
        includeChildren,
        scopeUser: toScopeUser(req.user),
      });

      res.json({
        ok: true,
        data: reportData,
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

  // Метрики заполнения отчетных форм
  async getReportsDashboard(req: Request, res: Response) {
    try {
      const orgUnits = await storage.getOrganizations();
      const orgId = (req.query.orgId as string) || req.user?.orgUnitId;
      const period = req.query.period as string;

      if (!req.user?.orgUnitId) {
        return res.status(400).json({ ok: false, msg: "org unit required" });
      }

      if (!period) {
        return res.status(400).json({ ok: false, msg: "period required" });
      }

      const { assertOrgScope } = await import("../services/authz");
      try {
        assertOrgScope(orgUnits, req.user?.orgUnitId, orgId || req.user?.orgUnitId);
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: "forbidden" });
      }

      const resolvedOrgId = orgId || req.user?.orgUnitId;
      const reportForms = await storage.getReportForms({
        orgUnitId: resolvedOrgId,
        period,
        scopeUser: toScopeUser(req.user),
      });
      const formDataMap = new Map(reportForms.map((form) => [form.form, form.data]));

      const summaries = REPORT_FORM_IDS.reduce<Record<string, ReportDashboardSummary>>((acc, formId) => {
        const data = (formDataMap.get(formId) as Record<string, any> | undefined) ?? {};
        const errors = validateReportData(formId, data);
        const completion = getReportCompletion(formId, data);
        acc[formId] = {
          completionPercent: completion.completionPercent,
          totalFields: completion.totalFields,
          emptyFields: completion.emptyFields,
          validationErrors: errors.length,
        };
        return acc;
      }, {});

      res.json({ ok: true, data: { period, forms: summaries } });
    } catch (error) {
      console.error("Error fetching report dashboard:", error);
      res.status(500).json({ ok: false, msg: "Failed to fetch report dashboard" });
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
      const { form, period, status } = req.body || {};

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

      const reportData = await storage.getReportFormData({
        orgId,
        period,
        form,
        scopeUser: toScopeUser(req.user),
      });
      const computedData = getComputedValidationData(form, reportData);
      const errors = validateReportData(form, computedData);
      if (status === 'submitted' && errors.length > 0) {
        return res.status(400).json({ ok: false, msg: 'validation failed', errors });
      }

      const reportForm = await storage.upsertReportForm({
        orgUnitId: orgId,
        period,
        form,
        data: {},
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

type ReportDashboardSummary = {
  completionPercent: number;
  totalFields: number;
  emptyFields: number;
  validationErrors: number;
};

const REPORT_FORM_IDS = ['1-osp', '2-ssg', '3-spvp', '4-sovp', '5-spzs', '6-sspz', 'co'] as const;
const FORM_1_FIELDS = ['total', 'urban', 'rural'] as const;
const FORM_3_FIELDS = ['fires_total', 'fires_high_risk', 'damage_total', 'damage_high_risk'] as const;
const FORM_4_FIELDS = ['fires_total', 'damage_total', 'deaths_total', 'injuries_total'] as const;
const FORM_5_FIELDS = ['urban', 'rural'] as const;
const FORM_6_FIELDS = [
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
] as const;
const FORM_7_FIELDS = ['killed_total', 'injured_total'] as const;

const flattenRows = <T extends { id?: string; children?: T[] }>(
  rows: T[],
  options?: { skipSections?: boolean }
): string[] => {
  const ids: string[] = [];
  const walk = (items: T[]) => {
    items.forEach((item) => {
      const isSection = options?.skipSections && 'isSection' in item && Boolean((item as { isSection?: boolean }).isSection);
      if (!isSection && item.id) {
        ids.push(item.id);
      }
      if (item.children) {
        walk(item.children);
      }
    });
  };
  walk(rows);
  return ids;
};

const isEmptyValue = (value: unknown) =>
  value === null ||
  value === undefined ||
  value === "" ||
  (typeof value === "number" && Number.isNaN(value));

const getComputedValidationData = (form: string, payload: any): Record<string, any> => {
  const result: Record<string, any> = {};
  const assignRow = (rowId: string | undefined, value: any) => {
    if (!rowId) {
      return;
    }
    result[rowId] = value;
  };
  const walkRows = (rows: any[] | undefined, mapper: (row: any) => void) => {
    if (!rows) {
      return;
    }
    rows.forEach((row) => {
      mapper(row);
      if (row.children) {
        walkRows(row.children, mapper);
      }
    });
  };

  if (form === "2-ssg") {
    walkRows(payload?.rows, (row) => assignRow(row.code ?? row.id, row.value ?? 0));
    return result;
  }

  if (form === "6-sspz") {
    const rows = [...(payload?.steppeRows ?? []), ...(payload?.ignitionRows ?? [])];
    rows.forEach((row) => assignRow(row.id, row.values ?? {}));
    return result;
  }

  walkRows(payload?.rows, (row) => assignRow(row.code ?? row.id, row.values ?? {}));
  return result;
};

const getReportCompletion = (form: string, data: Record<string, any>) => {
  const getFieldValue = (rowId: string, field?: string) => {
    if (!field) {
      return data?.[rowId];
    }
    return data?.[rowId]?.[field];
  };

  let rowIds: string[] = [];
  let fields: string[] = [];

  switch (form) {
    case "1-osp":
      rowIds = flattenRows(FORM_1_OSP_ROWS);
      fields = [...FORM_1_FIELDS];
      break;
    case "2-ssg":
      rowIds = NON_FIRE_CASES.map((item) => item.code);
      fields = ["value"];
      break;
    case "3-spvp":
      rowIds = flattenRows(FIRE_CAUSES);
      fields = [...FORM_3_FIELDS];
      break;
    case "4-sovp":
      rowIds = flattenRows(FORM_4_SOVP_ROWS);
      fields = [...FORM_4_FIELDS];
      break;
    case "5-spzs":
      rowIds = flattenRows(FORM_5_ROWS, { skipSections: true });
      fields = [...FORM_5_FIELDS];
      break;
    case "6-sspz":
      rowIds = [...FORM_6_STEPPE_FIRES_ROWS, ...FORM_6_IGNITIONS_ROWS].map((row) => row.id);
      fields = [...FORM_6_FIELDS];
      break;
    case "co":
      rowIds = flattenRows(FORM_7_CO_ROWS);
      fields = [...FORM_7_FIELDS];
      break;
    default:
      break;
  }

  const totalFields = rowIds.length * fields.length;
  let emptyFields = 0;

  rowIds.forEach((rowId) => {
    if (form === "2-ssg") {
      const value = getFieldValue(rowId);
      if (isEmptyValue(value)) {
        emptyFields += 1;
      }
      return;
    }
    fields.forEach((field) => {
      const value = getFieldValue(rowId, field);
      if (isEmptyValue(value)) {
        emptyFields += 1;
      }
    });
  });

  const completionPercent = totalFields === 0 ? 0 : Math.round(((totalFields - emptyFields) / totalFields) * 100);

  return { completionPercent, totalFields, emptyFields };
};
