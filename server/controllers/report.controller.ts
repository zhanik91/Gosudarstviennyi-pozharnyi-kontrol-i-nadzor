import type { Request, Response } from "express";
import * as XLSX from "xlsx";
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
      const userRole = (req.user as any)?.role?.toUpperCase();
      const isGlobalAccess = userRole === 'ADMIN' || userRole === 'MCHS';

      // Для admin/MCHS используем корневую организацию и includeChildren по умолчанию
      const orgId = (req.query.orgId as string) || req.user?.orgUnitId || (isGlobalAccess ? 'mchs-rk' : undefined);
      const includeChildren = req.query.includeChildren === 'true' || isGlobalAccess;
      const period = req.query.period as string;
      const form = req.query.form as string;
      const region = req.query.region as string | undefined;

      if (!form) {
        return res.status(400).json({ ok: false, msg: "form required" });
      }

      // Проверка доступа к организации
      const { assertOrgScope, assertTreeAccess } = await import('../services/authz');

      try {
        // Для admin/MCHS пропускаем проверку org scope
        const userOrgId = (req.user as any)?.orgUnitId || (isGlobalAccess ? 'mchs-rk' : undefined);
        if (!userOrgId && !isGlobalAccess) {
          return res.status(400).json({ ok: false, msg: 'org unit required' });
        }
        const resolvedOrgId = (orgId as string) || (userOrgId as string);

        if (!isGlobalAccess && resolvedOrgId) {
          assertOrgScope(orgUnits, userOrgId!, resolvedOrgId);
        }

        if (includeChildren && !isGlobalAccess) {
          assertTreeAccess(req.user?.role || 'DISTRICT');
        }
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: 'forbidden' });
      }

      const finalOrgId = (orgId as string) || (req.user as any)?.orgUnitId || (isGlobalAccess ? 'mchs-rk' : 'mchs-rk');
      if (!finalOrgId) {
        return res.status(400).json({ ok: false, msg: 'org unit required' });
      }

      const reportData = await storage.getReportFormData({
        orgId: finalOrgId,
        period: (period as string) || "",
        form: form as string,
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
      const incidentStats = await storage.getIncidentStats({
        scopeUser: toScopeUser(req.user),
      });
      const stats = {
        incidents: incidentStats.totalIncidents,
        objects: await storage.getObjectsCount(),
        reports: await storage.getReportsCount(),
        users: await storage.getUsersCount(),
        inspections: await storage.getInspectionsCount(),
        adminCases: await storage.getAdminCasesCount(),
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

      const userOrgId = (req.user as any)?.orgUnitId;
      if (!userOrgId) {
        return res.status(400).json({ ok: false, msg: "org unit required" });
      }

      if (!period) {
        return res.status(400).json({ ok: false, msg: "period required" });
      }

      try {
        const { assertOrgScope } = await import("../services/authz");
        assertOrgScope(orgUnits, userOrgId, (orgId as string) || userOrgId);
      } catch (error: any) {
        return res.status(403).json({ ok: false, msg: "forbidden" });
      }

      const resolvedOrgId = (orgId as string) || userOrgId;
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
      const orgId = req.query.orgId as string;
      const period = req.query.period as string;
      const includeChildren = req.query.includeChildren === 'true';
      const userOrgId = (req.user as any)?.orgUnitId;

      if (!userOrgId) {
        return res.status(400).json({ ok: false, msg: 'org unit required' });
      }

      const { assertOrgScope, assertTreeAccess } = await import('../services/authz');

      try {
        assertOrgScope(orgUnits, userOrgId, orgId);
        if (includeChildren) {
          assertTreeAccess((req.user as any)?.role || 'DISTRICT');
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
      const orgId = (req.user as any)?.orgUnitId;
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

      const allowedForms = new Set(['1-osp', '2-ssg', '3-spvp', '4-sovp', '5-spzhs', '6-sspz', 'co', 'admin-practice']);
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
        data: computedData,
        status: status === 'submitted' ? 'submitted' : 'draft',
      });

      res.json({ ok: true, data: reportForm, errors });
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ ok: false, msg: 'Failed to save report' });
    }
  }

  // Генерация шаблона для импорта
  async importTemplate(req: Request, res: Response) {
    try {
      const { form, period } = req.query;
      if (!form || !period) {
        return res.status(400).json({ ok: false, msg: "form and period required" });
      }

      const orgId = (req.user as any)?.orgUnitId || 'mchs-rk';

      // Находим все дочерние организации (области/районы)
      const hierarchy = await storage.getOrganizationHierarchy(orgId);

      // Оставляем только те, у которых тип совпадает с тем, что нам нужно импортировать
      // Обычно импортируют по областям (DCHS) или районам (DISTRICT)
      const targetUnits = hierarchy.filter(u => u.id !== orgId);

      // Определяем столбцы для формы
      const indicatorIds = getFormIndicatorIds(form as string);
      const indicatorFields = getFormIndicatorFields(form as string);

      const header = ["ID Организации", "Наименование организации"];
      indicatorIds.forEach(id => {
        indicatorFields.forEach(field => {
          header.push(`${id}:${field}`);
        });
      });

      const rows = [header];
      targetUnits.forEach(unit => {
        const row = [unit.id, unit.name];
        // Пустые ячейки для заполнения
        indicatorIds.forEach(() => {
          indicatorFields.forEach(() => {
            row.push("");
          });
        });
        rows.push(row);
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, "Template");

      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', `attachment; filename=template_${form}_${period}.xlsx`);
      res.header('Content-Length', buffer.length.toString());
      res.send(buffer);
    } catch (error: any) {
      console.error('Error generating template:', error);
      res.status(500).json({ ok: false, msg: error.message || 'Internal server error' });
    }
  }

  // Массовый импорт данных из Excel
  async importBulk(req: Request, res: Response) {
    try {
      const { form, period } = req.body;
      const file = (req as any).file;
      if (!form || !period || !file) {
        return res.status(400).json({ ok: false, msg: "form, period and file required" });
      }

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (data.length < 2) {
        return res.status(400).json({ ok: false, msg: "empty file" });
      }

      const headers = data[0];
      const resultRows = data.slice(1);
      const indicatorFields = getFormIndicatorFields(form);

      let successCount = 0;

      for (const row of resultRows) {
        const orgId = row[0];
        if (!orgId) continue;

        const manualData: Record<string, any> = {};

        // Разбираем строку в объект data
        headers.forEach((header, index) => {
          if (index < 2) return;
          const [indicatorId, field] = String(header).split(':');
          if (!indicatorId) return;

          const rawValue = row[index];
          const value = rawValue === "" || rawValue === undefined ? 0 : Number(rawValue);

          if (indicatorFields.length === 1 && indicatorFields[0] === 'value') {
            manualData[indicatorId] = value;
          } else {
            if (!manualData[indicatorId]) manualData[indicatorId] = {};
            manualData[indicatorId][field] = value;
          }
        });

        // Конструктор полной структуры формы (rows с привязанными values)
        // Для простоты мы сохраняем только сырые значения, 
        // а storage.getReportFormData соберет их в rows.
        await storage.upsertReportForm({
          orgUnitId: orgId,
          period,
          form,
          data: manualData,
          status: 'submitted',
        });
        successCount++;
      }

      res.json({ ok: true, count: successCount });
    } catch (error) {
      console.error('Error importing bulk data:', error);
      res.status(500).json({ ok: false, msg: 'Import failed' });
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

const REPORT_FORM_IDS = ['1-osp', '2-ssg', '3-spvp', '4-sovp', '5-spzhs', '6-sspz', 'co', 'admin-practice'] as const;
const FORM_1_FIELDS = ['total', 'urban', 'rural'] as const;
const FORM_3_FIELDS = ['fires_total', 'fires_high_risk', 'damage_total', 'damage_high_risk'] as const;
const FORM_4_FIELDS = ['fires_total', 'damage_total', 'deaths_total', 'injuries_total'] as const;
const FORM_5_FIELDS = ['urban', 'rural'] as const;
const ADMIN_PRACTICE_FIELDS = ['inspections_total', 'violations_total', 'fines_total', 'fines_paid'] as const;
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

  if (form === "5-spzhs") {
    walkRows(payload?.rows, (row) => assignRow(row.code ?? row.id, row.values ?? {}));
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
    case "5-spzhs":
      rowIds = flattenRows(FORM_5_ROWS, { skipSections: true });
      fields = [...FORM_5_FIELDS];
      break;
    case "admin-practice":
      rowIds = ["main"];
      fields = [...ADMIN_PRACTICE_FIELDS];
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
const getFormIndicatorIds = (form: string): string[] => {
  switch (form) {
    case "1-osp": return flattenRows(FORM_1_OSP_ROWS);
    case "2-ssg": return NON_FIRE_CASES.map(i => i.code);
    case "3-spvp": return flattenRows(FIRE_CAUSES);
    case "4-sovp": return flattenRows(FORM_4_SOVP_ROWS);
    case "5-spzhs": return flattenRows(FORM_5_ROWS, { skipSections: true });
    case "admin-practice": return ["main"];
    case "6-sspz": return [...FORM_6_STEPPE_FIRES_ROWS, ...FORM_6_IGNITIONS_ROWS].map(r => r.id);
    case "co": return flattenRows(FORM_7_CO_ROWS);
    default: return [];
  }
};

const getFormIndicatorFields = (form: string): string[] => {
  switch (form) {
    case "1-osp": return [...FORM_1_FIELDS];
    case "2-ssg": return ["value"];
    case "3-spvp": return [...FORM_3_FIELDS];
    case "4-sovp": return [...FORM_4_FIELDS];
    case "5-spzhs": return [...FORM_5_FIELDS];
    case "admin-practice": return [...ADMIN_PRACTICE_FIELDS];
    case "6-sspz": return [...FORM_6_FIELDS];
    case "co": return [...FORM_7_FIELDS];
    default: return [];
  }
};
