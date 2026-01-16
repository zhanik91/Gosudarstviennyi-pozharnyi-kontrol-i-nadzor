import { db } from "./db";
import { incidents, type Incident, type InsertIncident } from "@shared/schema";
import { eq, and, desc, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";
import { OrganizationStorage } from "./organization.storage";

// Helper to avoid circular dependency if possible, or just instantiate locally
const orgStorage = new OrganizationStorage();

export class IncidentStorage {
  private incidentTypeLabels: Record<string, string> = {
    fire: "Пожары",
    nonfire: "Происшествия без пожара",
    steppe_fire: "Степные пожары",
    steppe_smolder: "Тление степи",
    co_nofire: "Отравление CO без пожара",
  };

  private getPeriodKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  private getPeriodRange(period?: string) {
    const fallback = this.getPeriodKey(new Date());
    const [year, month] = (period ?? fallback).split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate, periodKey: `${year}-${String(month).padStart(2, "0")}` };
  }

  private getYearRange(period?: string) {
    const fallback = this.getPeriodKey(new Date());
    const [year] = (period ?? fallback).split("-").map(Number);
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }

  private getPreviousPeriod(periodKey: string) {
    const [year, month] = periodKey.split("-").map(Number);
    const previousDate = new Date(year, month - 2, 1);
    return this.getPeriodKey(previousDate);
  }

  private async getOrganizationConditions(params: {
    organizationId?: string;
    includeSubOrgs?: boolean;
  }) {
    const conditions: any[] = [];

    if (params.organizationId) {
      if (params.includeSubOrgs) {
        const hierarchy = await orgStorage.getOrganizationHierarchy(params.organizationId);
        const orgIds = hierarchy.map((org) => org.id);
        conditions.push(inArray(incidents.organizationId, orgIds));
      } else {
        conditions.push(eq(incidents.organizationId, params.organizationId));
      }
    }

    return conditions;
  }

  private aggregateLabelSeries<T extends { count: number | string }>(
    rows: T[],
    getLabel: (row: T) => string
  ) {
    const map = new Map<string, number>();
    rows.forEach((row) => {
      const label = getLabel(row);
      map.set(label, (map.get(label) ?? 0) + Number(row.count || 0));
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getIncidents(filters?: {
    organizationId?: string;
    period?: string;
    includeSubOrgs?: boolean;
  }): Promise<Incident[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters?.organizationId) {
      if (filters.includeSubOrgs) {
        const hierarchy = await orgStorage.getOrganizationHierarchy(filters.organizationId);
        const orgIds = hierarchy.map(o => o.id);
        conditions.push(inArray(incidents.organizationId, orgIds));
      } else {
        conditions.push(eq(incidents.organizationId, filters.organizationId));
      }
    }

    if (filters?.period) {
      const [year, month] = filters.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    if (conditions.length > 0) {
      const result = await db.select().from(incidents).where(and(...conditions)).orderBy(desc(incidents.dateTime));
      return result as Incident[];
    }

    const result = await db.select().from(incidents).orderBy(desc(incidents.dateTime));
    return result as Incident[];
  }

  async getSimpleAnalytics(params: {
    organizationId?: string;
    period?: string;
    includeSubOrgs?: boolean;
  }): Promise<{
    regions: Array<{
      region: string;
      label: string;
      count: number;
      deaths: number;
      damage: number;
    }>;
    incidentTypes: Array<{
      incidentType: string;
      label: string;
      count: number;
      damage: number;
    }>;
  }> {
    const conditions: any[] = await this.getOrganizationConditions(params);

    if (params.period) {
      const [year, month] = params.period.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    const regionQuery = db
      .select({
        region: incidents.region,
        count: sql<number>`count(*)`,
        deaths: sql<number>`sum(deaths_total)`,
        damage: sql<number>`sum(damage)`,
      })
      .from(incidents);

    if (conditions.length > 0) {
      regionQuery.where(and(...conditions));
    }

    const regionStats = await regionQuery.groupBy(incidents.region);

    const typeQuery = db
      .select({
        incidentType: incidents.incidentType,
        count: sql<number>`count(*)`,
        damage: sql<number>`sum(damage)`,
      })
      .from(incidents);

    if (conditions.length > 0) {
      typeQuery.where(and(...conditions));
    }

    const incidentTypes = await typeQuery.groupBy(incidents.incidentType);

    return {
      regions: regionStats.map((item) => ({
        region: item.region ?? "unknown",
        label: item.region ?? "Не указан",
        count: Number(item.count) || 0,
        deaths: Number(item.deaths) || 0,
        damage: Number(item.damage) || 0,
      })),
      incidentTypes: incidentTypes.map((item) => ({
        incidentType: item.incidentType,
        label: this.incidentTypeLabels[item.incidentType] ?? item.incidentType,
        count: Number(item.count) || 0,
        damage: Number(item.damage) || 0,
      })),
    };
  }

  async getFormAnalytics(params: {
    organizationId?: string;
    period?: string;
    includeSubOrgs?: boolean;
  }) {
    const orgConditions = await this.getOrganizationConditions(params);
    const currentPeriod = this.getPeriodRange(params.period);
    const previousPeriodKey = this.getPreviousPeriod(currentPeriod.periodKey);
    const previousPeriod = this.getPeriodRange(previousPeriodKey);
    const yearRange = this.getYearRange(currentPeriod.periodKey);
    const ospIncidentTypes = ["fire", "steppe_fire"] as const;

    const baseConditions = [
      ...orgConditions,
      gte(incidents.dateTime, currentPeriod.startDate),
      lte(incidents.dateTime, currentPeriod.endDate),
    ];

    const labelOrFallback = (value?: string | null, fallback?: string | null) =>
      value || fallback || "Не указано";

    const form1MonthlyRows = await db
      .select({
        month: sql<string>`to_char(date_time, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
        deaths: sql<number>`sum(deaths_total)`,
        injured: sql<number>`sum(injured_total)`,
        damage: sql<number>`sum(damage)`,
      })
      .from(incidents)
      .where(
        and(
          ...orgConditions,
          inArray(incidents.incidentType, ospIncidentTypes),
          gte(incidents.dateTime, yearRange.startDate),
          lte(incidents.dateTime, yearRange.endDate)
        )
      )
      .groupBy(sql`to_char(date_time, 'YYYY-MM')`)
      .orderBy(sql`to_char(date_time, 'YYYY-MM')`);

    const form1LocalityRows = await db
      .select({
        locality: incidents.locality,
        count: sql<number>`count(*)`,
        deaths: sql<number>`sum(deaths_total)`,
        injured: sql<number>`sum(injured_total)`,
        damage: sql<number>`sum(damage)`,
      })
      .from(incidents)
      .where(and(...baseConditions, inArray(incidents.incidentType, ospIncidentTypes)))
      .groupBy(incidents.locality);

    const form1Totals = form1LocalityRows.reduce(
      (acc, row) => ({
        deaths: acc.deaths + Number(row.deaths || 0),
        injured: acc.injured + Number(row.injured || 0),
        damage: acc.damage + Number(row.damage || 0),
      }),
      { deaths: 0, injured: 0, damage: 0 }
    );

    const form2CauseRows = await db
      .select({
        cause: incidents.cause,
        causeCode: incidents.causeCode,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(and(...baseConditions, eq(incidents.incidentType, "nonfire")))
      .groupBy(incidents.cause, incidents.causeCode);

    const form2RegionRows = await db
      .select({
        region: incidents.region,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(and(...baseConditions, eq(incidents.incidentType, "nonfire")))
      .groupBy(incidents.region);

    const form3CauseRows = await db
      .select({
        cause: incidents.cause,
        causeCode: incidents.causeCode,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(and(...baseConditions, eq(incidents.incidentType, "fire")))
      .groupBy(incidents.cause, incidents.causeCode);

    const form4ObjectRows = await db
      .select({
        objectType: incidents.objectType,
        objectCode: incidents.objectCode,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(and(...baseConditions, eq(incidents.incidentType, "fire")))
      .groupBy(incidents.objectType, incidents.objectCode);

    const previousObjectRows = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(
        and(
          ...orgConditions,
          eq(incidents.incidentType, "fire"),
          gte(incidents.dateTime, previousPeriod.startDate),
          lte(incidents.dateTime, previousPeriod.endDate)
        )
      );

    const currentObjectTotal = form4ObjectRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const previousObjectTotal = previousObjectRows.reduce(
      (sum, row) => sum + Number(row.count || 0),
      0
    );

    const residentialFilter = or(
      ilike(incidents.objectType, "%жил%"),
      ilike(incidents.objectType, "%residen%"),
      eq(incidents.objectType, "residential")
    );

    const form5LocalityRows = await db
      .select({
        locality: incidents.locality,
        count: sql<number>`count(*)`,
        damage: sql<number>`sum(damage)`,
      })
      .from(incidents)
      .where(and(...baseConditions, eq(incidents.incidentType, "fire"), residentialFilter))
      .groupBy(incidents.locality);

    const steppeTypes = ["steppe_fire", "steppe_smolder"] as const;

    const form6MonthlyRows = await db
      .select({
        month: sql<string>`to_char(date_time, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(
        and(
          ...orgConditions,
          inArray(incidents.incidentType, steppeTypes),
          gte(incidents.dateTime, yearRange.startDate),
          lte(incidents.dateTime, yearRange.endDate)
        )
      )
      .groupBy(sql`to_char(date_time, 'YYYY-MM')`)
      .orderBy(sql`to_char(date_time, 'YYYY-MM')`);

    const form6RegionRows = await db
      .select({
        region: incidents.region,
        count: sql<number>`count(*)`,
      })
      .from(incidents)
      .where(and(...baseConditions, inArray(incidents.incidentType, steppeTypes)))
      .groupBy(incidents.region);

    const form7RegionRows = await db
      .select({
        region: incidents.region,
        count: sql<number>`count(*)`,
        deaths: sql<number>`sum(deaths_co_total)`,
        injured: sql<number>`sum(injured_co_total)`,
      })
      .from(incidents)
      .where(and(...baseConditions, eq(incidents.incidentType, "co_nofire")))
      .groupBy(incidents.region);

    const form7Totals = form7RegionRows.reduce(
      (acc, row) => ({
        deaths: acc.deaths + Number(row.deaths || 0),
        injured: acc.injured + Number(row.injured || 0),
      }),
      { deaths: 0, injured: 0 }
    );

    const form2Causes = this.aggregateLabelSeries(form2CauseRows, (row) =>
      labelOrFallback(row.cause, row.causeCode)
    );
    const form3Causes = this.aggregateLabelSeries(form3CauseRows, (row) =>
      labelOrFallback(row.cause, row.causeCode)
    );
    const form4Objects = this.aggregateLabelSeries(form4ObjectRows, (row) =>
      labelOrFallback(row.objectType, row.objectCode)
    );

    return {
      period: currentPeriod.periodKey,
      form1: {
        monthly: form1MonthlyRows.map((row) => ({
          month: row.month,
          count: Number(row.count) || 0,
          deaths: Number(row.deaths) || 0,
          injured: Number(row.injured) || 0,
          damage: Number(row.damage) || 0,
        })),
        locality: form1LocalityRows.map((row) => ({
          locality: row.locality ?? "unknown",
          label: row.locality === "cities" ? "Город" : row.locality === "rural" ? "Село" : "Не указано",
          count: Number(row.count) || 0,
          deaths: Number(row.deaths) || 0,
          injured: Number(row.injured) || 0,
          damage: Number(row.damage) || 0,
        })),
        totals: form1Totals,
      },
      form2: {
        causes: form2Causes,
        regions: form2RegionRows.map((row) => ({
          label: row.region ?? "Не указан",
          count: Number(row.count) || 0,
        })),
      },
      form3: {
        causes: form3Causes,
        topCauses: form3Causes.slice(0, 10),
      },
      form4: {
        objects: form4Objects.slice(0, 10),
        comparison: {
          current: currentObjectTotal,
          previous: previousObjectTotal,
          delta: currentObjectTotal - previousObjectTotal,
          percent: previousObjectTotal
            ? Number(((currentObjectTotal - previousObjectTotal) / previousObjectTotal) * 100)
            : null,
        },
      },
      form5: {
        locality: form5LocalityRows.map((row) => ({
          locality: row.locality ?? "unknown",
          label: row.locality === "cities" ? "Город" : row.locality === "rural" ? "Село" : "Не указано",
          count: Number(row.count) || 0,
          damage: Number(row.damage) || 0,
        })),
      },
      form6: {
        monthly: form6MonthlyRows.map((row) => ({
          month: row.month,
          count: Number(row.count) || 0,
        })),
        regions: form6RegionRows.map((row) => ({
          label: row.region ?? "Не указан",
          count: Number(row.count) || 0,
        })),
      },
      form7: {
        totals: form7Totals,
        regions: form7RegionRows.map((row) => ({
          label: row.region ?? "Не указан",
          count: Number(row.count) || 0,
          deaths: Number(row.deaths) || 0,
          injured: Number(row.injured) || 0,
        })),
      },
    };
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(incidentData: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(incidents).values(incidentData as any).returning();
    return incident as Incident;
  }

  async updateIncident(id: string, incidentData: Partial<InsertIncident>): Promise<Incident> {
    const updateData = { ...incidentData, updatedAt: new Date() };
    const [incident] = await db
      .update(incidents)
      .set(updateData as any)
      .where(eq(incidents.id, id))
      .returning();
    return incident as Incident;
  }

  async deleteIncident(id: string): Promise<void> {
    await db.delete(incidents).where(eq(incidents.id, id));
  }

  async getIncidentStats(organizationId: string, period?: string): Promise<{
    totalIncidents: number;
    totalDeaths: number;
    totalInjured: number;
    totalDamage: number;
  }> {
    const conditions = [eq(incidents.organizationId, organizationId)];

    if (period) {
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    const query = db
      .select({
        totalIncidents: sql<number>`count(*)`,
        totalDeaths: sql<number>`sum(${incidents.deathsTotal})`,
        totalInjured: sql<number>`sum(${incidents.injuredTotal})`,
        totalDamage: sql<number>`sum(${incidents.damage})`,
      })
      .from(incidents)
      .where(and(...conditions));

    const [result] = await query;

    return {
      totalIncidents: Number(result.totalIncidents) || 0,
      totalDeaths: Number(result.totalDeaths) || 0,
      totalInjured: Number(result.totalInjured) || 0,
      totalDamage: Number(result.totalDamage) || 0,
    };
  }

  async getIncidentsCount(): Promise<number> {
    const allIncidents = await db.select().from(incidents);
    return allIncidents.length;
  }

  async searchIncidents(query: string, filters: any = {}): Promise<any[]> {
    const conditions = [];

    if (query) {
      conditions.push(
        or(
          ilike(incidents.address, `%${query}%`),
          ilike(incidents.description, `%${query}%`)
        )
      );
    }

    if (filters.organizationId) {
      if (filters.includeSubOrgs) {
        const hierarchy = await orgStorage.getOrganizationHierarchy(filters.organizationId);
        const orgIds = hierarchy.map(o => o.id);
        conditions.push(inArray(incidents.organizationId, orgIds));
      } else {
        conditions.push(eq(incidents.organizationId, filters.organizationId));
      }
    }

    if (filters.region) conditions.push(eq(incidents.region, filters.region));
    if (filters.incidentType) conditions.push(eq(incidents.incidentType, filters.incidentType));
    if (filters.dateFrom) {
      const startDate = new Date(filters.dateFrom);
      if (!Number.isNaN(startDate.getTime())) {
        conditions.push(gte(incidents.dateTime, startDate));
      }
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      if (!Number.isNaN(endDate.getTime())) {
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(incidents.dateTime, endDate));
      }
    }

    if (conditions.length > 0) {
      const result = await db.select().from(incidents).where(and(...conditions)).orderBy(desc(incidents.dateTime)).limit(100);
      return result as any[];
    }

    const result = await db.select().from(incidents).orderBy(desc(incidents.dateTime)).limit(100);
    return result as any[];
  }

  // Advanced Analytics (Charts/Maps)
  async getAdvancedAnalytics(params: any): Promise<any> {
    const { period, organizationId } = params;

    // Статистика по типам происшествий
    const incidentTypes = await db.select({
      type: incidents.incidentType,
      count: sql<number>`count(*)`,
      damage: sql<number>`sum(damage)`
    })
    .from(incidents)
    .groupBy(incidents.incidentType);

    // Статистика по регионам
    const regionStats = await db.select({
      region: incidents.region,
      count: sql<number>`count(*)`,
      deaths: sql<number>`sum(deaths_total)`,
      damage: sql<number>`sum(damage)`
    })
    .from(incidents)
    .groupBy(incidents.region);

    // Временная динамика
    const monthlyStats = await db.select({
      month: sql<string>`to_char(date_time, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
      damage: sql<number>`sum(damage)`
    })
    .from(incidents)
    .groupBy(sql`to_char(date_time, 'YYYY-MM')`)
    .orderBy(sql`to_char(date_time, 'YYYY-MM')`);

    return {
      incidentTypes,
      regionStats,
      monthlyStats,
      summary: {
        totalIncidents: incidentTypes.reduce((sum, item) => sum + Number(item.count), 0),
        totalDamage: regionStats.reduce((sum, item) => sum + Number(item.damage || 0), 0),
        totalDeaths: regionStats.reduce((sum, item) => sum + Number(item.deaths || 0), 0)
      }
    };
  }

  // Данные для отчетов (Excel)
  async getReportData(params: {
    orgId: string;
    period?: string;
    form?: string;
    includeChildren?: boolean;
  }): Promise<any> {
    const conditions = [];
    const ospIncidentTypes = ['fire', 'steppe_fire'] as const;

    if (params.includeChildren) {
      const hierarchy = await orgStorage.getOrganizationHierarchy(params.orgId);
      const orgIds = hierarchy.map(o => o.id);
      conditions.push(inArray(incidents.organizationId, orgIds));
    } else {
      conditions.push(eq(incidents.organizationId, params.orgId));
    }

    if (params.period) {
      const [year, month] = params.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    if (params.form === '1-osp') {
      conditions.push(inArray(incidents.incidentType, ospIncidentTypes));
    }

    const query = db
      .select({
        totalIncidents: sql<number>`count(*)`,
        cityIncidents: sql<number>`count(*) filter (where locality = 'cities')`,
        ruralIncidents: sql<number>`count(*) filter (where locality = 'rural')`,
        totalDeaths: sql<number>`sum(deaths_total)`,
        cityDeaths: sql<number>`sum(deaths_total) filter (where locality = 'cities')`,
        ruralDeaths: sql<number>`sum(deaths_total) filter (where locality = 'rural')`,
        childDeaths: sql<number>`sum(deaths_children)`,
        totalInjured: sql<number>`sum(injured_total)`,
        totalDamage: sql<number>`sum(damage)`,
        cityDamage: sql<number>`sum(damage) filter (where locality = 'cities')`,
        ruralDamage: sql<number>`sum(damage) filter (where locality = 'rural')`,
      })
      .from(incidents)
      .where(and(...conditions));

    const [result] = await query;

    return {
      orgId: params.orgId,
      period: params.period,
      form: params.form,
      osp: {
        totalFires: Number(result.totalIncidents) || 0,
        cityFires: Number(result.cityIncidents) || 0,
        ruralFires: Number(result.ruralIncidents) || 0,
        totalDeaths: Number(result.totalDeaths) || 0,
        cityDeaths: Number(result.cityDeaths) || 0,
        ruralDeaths: Number(result.ruralDeaths) || 0,
        childDeaths: Number(result.childDeaths) || 0,
        totalInjured: Number(result.totalInjured) || 0,
        totalDamage: Number(result.totalDamage) || 0,
        cityDamage: Number(result.cityDamage) || 0,
        ruralDamage: Number(result.ruralDamage) || 0,
      }
    };
  }
}
