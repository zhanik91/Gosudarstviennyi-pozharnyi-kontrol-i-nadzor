import { db } from "./db";
import { incidents, type Incident, type InsertIncident } from "@shared/schema";
import { eq, and, desc, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";
import { OrganizationStorage } from "./organization.storage";

// Helper to avoid circular dependency if possible, or just instantiate locally
const orgStorage = new OrganizationStorage();

export class IncidentStorage {
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
