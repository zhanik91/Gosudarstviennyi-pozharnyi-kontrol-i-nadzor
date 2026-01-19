import { db } from "./db";
import { incidents, packages, type Package, type InsertPackage } from "@shared/schema";
import { eq, and, desc, gte, inArray, lte, sql } from "drizzle-orm";
import { isAdmin, type ScopeUser } from "../services/authz";
import { OrganizationStorage } from "./organization.storage";

const orgStorage = new OrganizationStorage();

export class PackageStorage {
  async getPackages(filters?: {
    orgUnitId?: string;
    status?: string;
    period?: string;
    scopeUser?: ScopeUser;
  }): Promise<Package[]> {
    let query = db.select().from(packages);
    const conditions = [];

    if (filters?.orgUnitId) {
      conditions.push(eq(packages.orgUnitId, filters.orgUnitId));
    }

    if (filters?.status) {
      conditions.push(eq(packages.status, filters.status as any));
    }

    if (filters?.period) {
      conditions.push(eq(packages.period, filters.period));
    }

    // Packages доступны только админам МЧС
    // ДЧС и ОЧС не имеют доступа к пакетам отчетности
    if (filters?.scopeUser && !isAdmin(filters.scopeUser)) {
      return [];
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(packages.createdAt)) as Package[];
  }

  async getPackage(id: string): Promise<Package | undefined> {
    const [pkg] = await db.select().from(packages).where(eq(packages.id, id));
    return pkg;
  }

  async createPackage(packageData: InsertPackage): Promise<Package> {
    const [pkg] = await db.insert(packages).values(packageData).returning();
    return pkg;
  }

  async updatePackage(id: string, packageData: Partial<InsertPackage>): Promise<Package> {
    const [pkg] = await db
      .update(packages)
      .set({ ...packageData, updatedAt: new Date() })
      .where(eq(packages.id, id))
      .returning();
    return pkg;
  }

  async getApprovedPackages(orgId: string, period: string): Promise<any[]> {
    return [
      { id: 'pkg-001', orgId: 'child-org-1', period, status: 'approved', createdAt: new Date() }
    ];
  }

  async createConsolidatedPackage(data: any): Promise<any> {
    return { id: 'consolidated-' + Date.now(), ...data, createdAt: new Date() };
  }

  async getReportsCount(): Promise<number> {
    const allPackages = await db.select().from(packages);
    return allPackages.length;
  }

  async validateReports(orgId: string, period?: string, includeChildren?: boolean): Promise<any[]> {
    const conditions = [];
    if (includeChildren) {
      const hierarchy = await orgStorage.getOrganizationHierarchy(orgId);
      const orgIds = hierarchy.map((org) => org.id);
      conditions.push(inArray(incidents.orgUnitId, orgIds));
    } else {
      conditions.push(eq(incidents.orgUnitId, orgId));
    }

    if (period) {
      const [year, month] = period.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    const [aggregate] = await db
      .select({
        totalIncidents: sql<number>`count(*)`,
        missingLocality: sql<number>`count(*) filter (where ${incidents.locality} is null or ${incidents.locality} = '')`,
        missingCauseCode: sql<number>`count(*) filter (where ${incidents.incidentType} = 'fire' and (${incidents.causeCode} is null or ${incidents.causeCode} = ''))`,
        missingObjectCode: sql<number>`count(*) filter (where ${incidents.incidentType} = 'fire' and (${incidents.objectCode} is null or ${incidents.objectCode} = ''))`,
        missingDamage: sql<number>`count(*) filter (where ${incidents.incidentType} = 'fire' and ${incidents.damage} is null)`,
        deathsTotal: sql<number>`sum(${incidents.deathsTotal})`,
        deathsChildren: sql<number>`sum(${incidents.deathsChildren})`,
        injuredTotal: sql<number>`sum(${incidents.injuredTotal})`,
        injuredChildren: sql<number>`sum(${incidents.injuredChildren})`,
        deathsCOTotal: sql<number>`sum(${incidents.deathsCOTotal})`,
        deathsCOChildren: sql<number>`sum(${incidents.deathsCOChildren})`,
        injuredCOTotal: sql<number>`sum(${incidents.injuredCOTotal})`,
        injuredCOChildren: sql<number>`sum(${incidents.injuredCOChildren})`,
        steppeArea: sql<number>`sum(${incidents.steppeArea})`,
        steppeAnimalsTotal: sql<number>`sum(${incidents.steppeAnimalsTotal})`,
        steppeAnimalsDead: sql<number>`sum(${incidents.steppeAnimalsDead})`,
        steppeAnimalsInjured: sql<number>`sum(${incidents.steppeAnimalsInjured})`,
        steppePeopleTotal: sql<number>`sum(${incidents.steppePeopleTotal})`,
        steppePeopleDead: sql<number>`sum(${incidents.steppePeopleDead})`,
        steppePeopleInjured: sql<number>`sum(${incidents.steppePeopleInjured})`,
        steppeExtinguishedArea: sql<number>`sum(${incidents.steppeExtinguishedArea})`,
      })
      .from(incidents)
      .where(and(...conditions));

    const results: Array<{ form: string; section: string; description: string; severity: string }> = [];
    const totalIncidents = Number(aggregate?.totalIncidents ?? 0);
    const missingLocality = Number(aggregate?.missingLocality ?? 0);
    const missingCauseCode = Number(aggregate?.missingCauseCode ?? 0);
    const missingObjectCode = Number(aggregate?.missingObjectCode ?? 0);
    const missingDamage = Number(aggregate?.missingDamage ?? 0);
    const deathsTotal = Number(aggregate?.deathsTotal ?? 0);
    const deathsChildren = Number(aggregate?.deathsChildren ?? 0);
    const injuredTotal = Number(aggregate?.injuredTotal ?? 0);
    const injuredChildren = Number(aggregate?.injuredChildren ?? 0);
    const deathsCOTotal = Number(aggregate?.deathsCOTotal ?? 0);
    const deathsCOChildren = Number(aggregate?.deathsCOChildren ?? 0);
    const injuredCOTotal = Number(aggregate?.injuredCOTotal ?? 0);
    const injuredCOChildren = Number(aggregate?.injuredCOChildren ?? 0);
    const steppeArea = Number(aggregate?.steppeArea ?? 0);
    const steppeAnimalsTotal = Number(aggregate?.steppeAnimalsTotal ?? 0);
    const steppeAnimalsDead = Number(aggregate?.steppeAnimalsDead ?? 0);
    const steppeAnimalsInjured = Number(aggregate?.steppeAnimalsInjured ?? 0);
    const steppePeopleTotal = Number(aggregate?.steppePeopleTotal ?? 0);
    const steppePeopleDead = Number(aggregate?.steppePeopleDead ?? 0);
    const steppePeopleInjured = Number(aggregate?.steppePeopleInjured ?? 0);
    const steppeExtinguishedArea = Number(aggregate?.steppeExtinguishedArea ?? 0);

    if (totalIncidents === 0) {
      results.push({
        form: "Сводка",
        section: "Данные",
        description: "Нет инцидентов за выбранный период.",
        severity: "warning",
      });
    }

    if (missingLocality > 0) {
      results.push({
        form: "1-ОСП",
        section: "Общие данные",
        description: `Не заполнена локальность (город/село) у ${missingLocality} инцидентов.`,
        severity: "error",
      });
    }

    if (missingCauseCode > 0) {
      results.push({
        form: "3-СПВП",
        section: "Причины пожаров",
        description: `Не указана причина пожара у ${missingCauseCode} инцидентов.`,
        severity: "warning",
      });
    }

    if (missingObjectCode > 0) {
      results.push({
        form: "4-СОВП",
        section: "Объекты пожаров",
        description: `Не указан объект пожара у ${missingObjectCode} инцидентов.`,
        severity: "warning",
      });
    }

    if (missingDamage > 0) {
      results.push({
        form: "1-ОСП",
        section: "Ущерб",
        description: `Не заполнен ущерб по ${missingDamage} инцидентам.`,
        severity: "warning",
      });
    }

    if (deathsChildren > deathsTotal) {
      results.push({
        form: "1-ОСП",
        section: "Погибшие",
        description: "Число погибших детей превышает общее число погибших.",
        severity: "error",
      });
    }

    if (injuredChildren > injuredTotal) {
      results.push({
        form: "1-ОСП",
        section: "Травмированные",
        description: "Число травмированных детей превышает общее число травмированных.",
        severity: "error",
      });
    }

    if (deathsCOChildren > deathsCOTotal) {
      results.push({
        form: "CO",
        section: "Погибшие",
        description: "Число погибших детей от CO превышает общее число погибших от CO.",
        severity: "error",
      });
    }

    if (injuredCOChildren > injuredCOTotal) {
      results.push({
        form: "CO",
        section: "Травмированные",
        description: "Число травмированных детей от CO превышает общее число травмированных от CO.",
        severity: "error",
      });
    }

    if (steppeAnimalsDead > steppeAnimalsTotal || steppeAnimalsInjured > steppeAnimalsTotal) {
      results.push({
        form: "6-ССПЗ",
        section: "Животные",
        description: "Число погибших/раненых животных превышает общее количество животных.",
        severity: "warning",
      });
    }

    if (steppePeopleDead > steppePeopleTotal || steppePeopleInjured > steppePeopleTotal) {
      results.push({
        form: "6-ССПЗ",
        section: "Пострадавшие",
        description: "Число погибших/раненых превышает общее количество пострадавших.",
        severity: "warning",
      });
    }

    if (steppeExtinguishedArea > steppeArea) {
      results.push({
        form: "6-ССПЗ",
        section: "Площадь",
        description: "Площадь ликвидированных степных пожаров превышает общую площадь пожаров.",
        severity: "warning",
      });
    }

    return results;
  }
}
