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

  async getReportFormsByOrgs(params: {
    orgUnitIds: string[];
    period: string;
    form: string;
  }): Promise<ReportForm[]> {
    return await db
      .select()
      .from(reportForms)
      .where(
        and(
          inArray(reportForms.orgUnitId, params.orgUnitIds),
          eq(reportForms.period, params.period),
          eq(reportForms.form, params.form)
        )
      );
  }
}
