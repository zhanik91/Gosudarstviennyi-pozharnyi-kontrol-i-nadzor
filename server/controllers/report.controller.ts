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

      const allowedForms = new Set(['1-osp', '2-ssg', '3-spvp', '4-sovp', '5-spzs', '6-sspz', 'co', 'admin-practice']);
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

      let orgId = (req.user as any)?.orgUnitId;
      if (!orgId) {
        const allOrgs = await storage.getAllOrganizations();
        const root = allOrgs.find(o => !o.parentId);
        orgId = root?.id || 'mchs-rk';
      }

      // Находим все дочерние организации (области/районы)
      const hierarchy = await storage.getOrganizationHierarchy(orgId);

      // Если мы МЧС, берем всех детей (ДЧС)
      // Если мы ДЧС, берем всех детей (Районы)
      // Если детей нет, берем саму организацию
      let targetUnits = hierarchy.filter(u => u.parentId === orgId);
      if (targetUnits.length === 0) {
        targetUnits = hierarchy.filter(u => u.id === orgId);
      }

      if (targetUnits.length === 0) {
        return res.status(404).json({ ok: false, msg: "No organizations found for template" });
      }

      // Матричный формат: Показатели в строках, Организации в колонках
      const indicators = getDetailedIndicators(form as string);
      const fields = getFormIndicatorFields(form as string);

      // Формируем заголовок (3 строки)
      // Строка 1: ID организаций (скрытая или техническая)
      const row1 = ["ID", "Наименование"];
      // Строка 2: Названия организаций
      const row2 = ["Код", "Показатель"];
      // Строка 3: Поля (всего, в городах...)
      const row3 = ["", ""];

      targetUnits.forEach(unit => {
        fields.forEach((field, fIdx) => {
          row1.push(unit.id);
          row2.push(fIdx === 0 ? unit.name : "");
          row3.push(getFieldLabel(field));
        });
      });

      const rows = [row1, row2, row3];

      indicators.forEach(ind => {
        const row = [ind.id, ind.label];
        targetUnits.forEach(() => {
          fields.forEach(() => {
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
      res.status(500).json({ ok: false, msg: `Ошибка генерации шаблона: ${error.message}` });
    }
  }

  // Массовый импорт данных из Excel (Матричный формат)
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

      if (data.length < 4) {
        return res.status(400).json({ ok: false, msg: "Недостаточно данных в файле. Ожидался матричный шаблон." });
      }

      const unitIds = data[0]; // Строка 1: ID организаций
      const fields = getFormIndicatorFields(form);
      const indicatorsRows = data.slice(3); // Данные начинаются с 4-й строки

      const orgDataMap: Record<string, Record<string, any>> = {};

      // Проходим по колонкам с данными (начиная с 3-й, индекс 2)
      for (let col = 2; col < unitIds.length; col++) {
        const orgId = unitIds[col];
        if (!orgId || orgId === "ID") continue;

        if (!orgDataMap[orgId]) orgDataMap[orgId] = {};

        indicatorsRows.forEach((row) => {
          const indicatorId = String(row[0]);
          if (!indicatorId || indicatorId === "undefined") return;

          // Определяем, какое это поле (всего, в городах...)
          // Колонки для одной организации идут блоком длиной fields.length
          // Нам нужно понять индекс поля внутри этого блока
          // Но проще всего: мы знаем текущую колонку 'col'. 
          // Нам нужно найти ее смещение относительно первого появления этого orgId.
          const firstColForOrg = unitIds.indexOf(orgId);
          const fieldIndex = col - firstColForOrg;
          const fieldName = fields[fieldIndex];

          if (!fieldName) return;

          const rawValue = row[col];
          const value = rawValue === "" || rawValue === undefined ? 0 : Number(rawValue);

          if (fields.length === 1 && fields[0] === 'value') {
            orgDataMap[orgId][indicatorId] = value;
          } else {
            if (!orgDataMap[orgId][indicatorId]) orgDataMap[orgId][indicatorId] = {};
            orgDataMap[orgId][indicatorId][fieldName] = value;
          }
        });
      }

      let successCount = 0;
      for (const [orgId, manualData] of Object.entries(orgDataMap)) {
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

const REPORT_FORM_IDS = ['1-osp', '2-ssg', '3-spvp', '4-sovp', '5-spzs', '6-sspz', 'co', 'admin-practice'] as const;
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

const flattenRowsWithLabels = <T extends { id?: string; number?: string; label?: string; children?: T[] }>(
  rows: T[],
  options?: { skipSections?: boolean }
): { id: string; label: string; number: string }[] => {
  const result: { id: string; label: string; number: string }[] = [];
  const walk = (items: T[]) => {
    items.forEach((item) => {
      const isSection = options?.skipSections && (item as any).isSection;
      if (!isSection && item.id) {
        result.push({
          id: item.id,
          label: item.label || '',
          number: item.number || item.id
        });
      }
      if (item.children) {
        walk(item.children);
      }
    });
  };
  walk(rows);
  return result;
};

const getDetailedIndicators = (form: string): { id: string; label: string; number: string }[] => {
  switch (form) {
    case "1-osp": return flattenRowsWithLabels(FORM_1_OSP_ROWS);
    case "2-ssg": return NON_FIRE_CASES.map(i => ({ id: i.code, label: i.name, number: i.code }));
    case "3-spvp": return flattenRowsWithLabels(FIRE_CAUSES);
    case "4-sovp": return flattenRowsWithLabels(FORM_4_SOVP_ROWS);
    case "5-spzs": return flattenRowsWithLabels(FORM_5_ROWS, { skipSections: true });
    case "6-sspz": return [...FORM_6_STEPPE_FIRES_ROWS, ...FORM_6_IGNITIONS_ROWS].map(r => ({ id: r.id, label: r.label, number: r.number || r.id }));
    case "co": return flattenRowsWithLabels(FORM_7_CO_ROWS);
    case "admin-practice": return [{ id: "main", label: "Административная практика", number: "1" }];
    default: return [];
  }
};

const getFieldLabel = (field: string): string => {
  switch (field) {
    case 'total':
    case 'value':
    case 'fires_total':
    case 'inspections_total':
      return 'Всего';
    case 'urban': return 'в городах';
    case 'rural': return 'в сельской местности';
    case 'fires_high_risk': return 'выс. риск';
    case 'damage_total':
    case 'damage_high_risk':
      return 'Ущерб';
    case 'deaths_total': return 'Погибло';
    case 'injuries_total': return 'Травмировано';
    case 'violations_total': return 'Нарушений';
    case 'fines_total': return 'Штрафы (наложено)';
    case 'fines_paid': return 'Штрафы (оплачено)';
    default: return field;
  }
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

  if (form === "5-spzs") {
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
      rowIds = getDetailedIndicators("1-osp").map(i => i.id);
      fields = [...FORM_1_FIELDS];
      break;
    case "2-ssg":
      rowIds = NON_FIRE_CASES.map((item) => item.code);
      fields = ["value"];
      break;
    case "3-spvp":
      rowIds = getDetailedIndicators("3-spvp").map(i => i.id);
      fields = [...FORM_3_FIELDS];
      break;
    case "4-sovp":
      rowIds = getDetailedIndicators("4-sovp").map(i => i.id);
      fields = [...FORM_4_FIELDS];
      break;
    case "5-spzs":
      rowIds = getDetailedIndicators("5-spzs").map(i => i.id);
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
      rowIds = getDetailedIndicators("co").map(i => i.id);
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
  return getDetailedIndicators(form).map(i => i.id);
};

const getFormIndicatorFields = (form: string): string[] => {
  switch (form) {
    case "1-osp": return [...FORM_1_FIELDS];
    case "2-ssg": return ["value"];
    case "3-spvp": return [...FORM_3_FIELDS];
    case "4-sovp": return [...FORM_4_FIELDS];
    case "5-spzs": return [...FORM_5_FIELDS];
    case "admin-practice": return [...ADMIN_PRACTICE_FIELDS];
    case "6-sspz": return [...FORM_6_FIELDS];
    case "co": return [...FORM_7_FIELDS];
    default: return [];
  }
};
