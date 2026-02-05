import { db } from "./db";
import { orgUnits, reportForms, type InsertReportForm, type ReportForm } from "@shared/schema";
import { and, eq, inArray } from "drizzle-orm";
import { applyScopeCondition, type ScopeUser } from "../services/authz";

export class ReportFormStorage {
  async getReportForm(params: {
    orgUnitId: string;
    period: string;
    form: string;
    scopeUser?: ScopeUser;
  }): Promise<ReportForm | undefined> {
    const conditions = [
      eq(reportForms.orgUnitId, params.orgUnitId),
      eq(reportForms.period, params.period),
      eq(reportForms.form, params.form),
    ];
    let query = db.select({ form: reportForms }).from(reportForms);

    if (params.scopeUser) {
      const scopeCondition = applyScopeCondition(params.scopeUser, orgUnits.regionName, orgUnits.unitName);
      if (scopeCondition) {
        query = query.innerJoin(orgUnits, eq(reportForms.orgUnitId, orgUnits.id));
        conditions.push(scopeCondition);
      }
    }

    const [row] = await query.where(and(...conditions));
    return row?.form;
  }

  async getReportForms(params: {
    orgUnitId: string;
    period: string;
    forms?: string[];
    scopeUser?: ScopeUser;
  }): Promise<ReportForm[]> {
    const conditions = [eq(reportForms.orgUnitId, params.orgUnitId), eq(reportForms.period, params.period)];
    if (params.forms && params.forms.length > 0) {
      conditions.push(inArray(reportForms.form, params.forms));
    }
    let query = db.select({ form: reportForms }).from(reportForms);
    if (params.scopeUser) {
      const scopeCondition = applyScopeCondition(params.scopeUser, orgUnits.regionName, orgUnits.unitName);
      if (scopeCondition) {
        query = query.innerJoin(orgUnits, eq(reportForms.orgUnitId, orgUnits.id));
        conditions.push(scopeCondition);
      }
    }
    const rows = await query.where(and(...conditions));
    return rows.map((row) => row.form);
  }

  async upsertReportForm(data: InsertReportForm): Promise<ReportForm> {
    const [reportForm] = await db
      .insert(reportForms)
      .values(data)
      .onConflictDoUpdate({
        target: [reportForms.orgUnitId, reportForms.period, reportForms.form],
        set: {
          data: data.data,
          status: data.status,
          updatedAt: new Date(),
        },
      })
      .returning();
    return reportForm;
  }

  async getReportFormsAnalytics(params: {
    period: string;
    form?: string;
  }): Promise<{
    regionData: Array<{ region: string; data: Record<string, number> }>;
    totals: Record<string, number>;
  }> {
    const conditions = [eq(reportForms.period, params.period)];
    if (params.form) {
      conditions.push(eq(reportForms.form, params.form));
    }

    const rows = await db
      .select({
        form: reportForms,
        regionName: orgUnits.regionName,
        unitName: orgUnits.name,
      })
      .from(reportForms)
      .innerJoin(orgUnits, eq(reportForms.orgUnitId, orgUnits.id))
      .where(and(...conditions));

    const regionData: Array<{ region: string; data: Record<string, number> }> = [];
    const totals: Record<string, number> = {};

    for (const row of rows) {
      const region = row.regionName || row.unitName || "Не указано";
      const formData = (row.form.data || {}) as Record<string, number>;
      
      regionData.push({ region, data: formData });
      
      for (const [key, value] of Object.entries(formData)) {
        if (typeof value === "number") {
          totals[key] = (totals[key] || 0) + value;
        }
      }
    }

    return { regionData, totals };
  }

  async getAllRegionsData(params: {
    period: string;
    scopeUser?: ScopeUser;
    region?: string;
  }): Promise<{
    form1: Array<{ region: string; fires: number; deaths: number; injured: number; damage: number }>;
    form2: Array<{ region: string; total: number }>;
  }> {
    const baseConditions1 = [
      eq(reportForms.period, params.period),
      eq(reportForms.form, "1-osp"),
    ];
    const baseConditions2 = [
      eq(reportForms.period, params.period),
      eq(reportForms.form, "2-ssg"),
    ];

    if (params.scopeUser) {
      const scopeCondition = applyScopeCondition(params.scopeUser, orgUnits.regionName, orgUnits.unitName);
      if (scopeCondition) {
        baseConditions1.push(scopeCondition);
        baseConditions2.push(scopeCondition);
      }
    }

    if (params.region) {
      baseConditions1.push(eq(orgUnits.regionName, params.region));
      baseConditions2.push(eq(orgUnits.regionName, params.region));
    }

    const form1Rows = await db
      .select({
        form: reportForms,
        regionName: orgUnits.regionName,
        unitName: orgUnits.name,
      })
      .from(reportForms)
      .innerJoin(orgUnits, eq(reportForms.orgUnitId, orgUnits.id))
      .where(and(...baseConditions1));

    const form2Rows = await db
      .select({
        form: reportForms,
        regionName: orgUnits.regionName,
        unitName: orgUnits.name,
      })
      .from(reportForms)
      .innerJoin(orgUnits, eq(reportForms.orgUnitId, orgUnits.id))
      .where(and(...baseConditions2));

    const form1Data = form1Rows.map(row => {
      const data = (row.form.data || {}) as Record<string, number>;
      return {
        region: row.regionName || row.unitName || "Не указано",
        fires: data.fires_total || 0,
        deaths: data.deaths_total || 0,
        injured: data.injured_total || 0,
        damage: data.damage_total || 0,
      };
    }).sort((a, b) => b.fires - a.fires);

    const form2Data = form2Rows.map(row => {
      const data = (row.form.data || {}) as Record<string, number>;
      const total = Object.values(data).reduce((sum, val) => sum + (typeof val === "number" ? val : 0), 0);
      return {
        region: row.regionName || row.unitName || "Не указано",
        total,
      };
    }).sort((a, b) => b.total - a.total);

    return { form1: form1Data, form2: form2Data };
  }
}
