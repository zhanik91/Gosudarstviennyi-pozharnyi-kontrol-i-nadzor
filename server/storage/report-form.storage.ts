import { db } from "./db";
import { reportForms, type InsertReportForm, type ReportForm } from "@shared/schema";
import { and, eq, inArray } from "drizzle-orm";

export class ReportFormStorage {
  async getReportForm(params: { orgUnitId: string; period: string; form: string }): Promise<ReportForm | undefined> {
    const [reportForm] = await db
      .select()
      .from(reportForms)
      .where(
        and(
          eq(reportForms.orgUnitId, params.orgUnitId),
          eq(reportForms.period, params.period),
          eq(reportForms.form, params.form)
        )
      );
    return reportForm;
  }

  async getReportForms(params: { orgUnitId: string; period: string; forms?: string[] }): Promise<ReportForm[]> {
    const conditions = [eq(reportForms.orgUnitId, params.orgUnitId), eq(reportForms.period, params.period)];
    if (params.forms && params.forms.length > 0) {
      conditions.push(inArray(reportForms.form, params.forms));
    }
    return await db.select().from(reportForms).where(and(...conditions));
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
}
