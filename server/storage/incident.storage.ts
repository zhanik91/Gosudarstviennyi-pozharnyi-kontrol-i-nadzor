import { db } from "./db";
import { incidents, incidentVictims, reportForms, orgUnits, type Incident, type InsertIncident, type InsertIncidentVictim } from "@shared/schema";
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
import { REGION_NAMES } from "@shared/regions";
import { resolveTimeOfDayBucket } from "@shared/time-of-day";
import {
  FORM_5_CONDITION_TO_ROW,
  FORM_5_DEATH_CAUSE_TO_ROW,
  FORM_5_DEATH_PLACE_TO_ROW,
  FORM_5_SOCIAL_STATUS_TO_ROW,
  FORM_7_DEAD_CONDITION_TO_ROW,
  FORM_7_DEAD_SOCIAL_STATUS_TO_ROW,
  FORM_7_INJURED_CONDITION_TO_ROW,
  FORM_7_INJURED_SOCIAL_STATUS_TO_ROW,
  normalizeIncidentVictimValue,
} from "@shared/constants/incident-victim.constants";
import { eq, and, desc, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";
import { OrganizationStorage } from "./organization.storage";
import { applyScopeCondition, type ScopeUser } from "../services/authz";
import { mapCoObjectCodeToForm7Rows } from "@shared/mappings/form7-co-object.mapping";

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
  private incidentSchemaCheckPromise?: Promise<void>;
  private missingIncidentColumns: string[] = [];

  private normalizeLocalityValue(locality: string | null | undefined) {
    if (!locality) return locality;
    return locality === "city_pgt" ? "cities" : locality;
  }

  private async ensureIncidentSchemaChecked() {
    if (!this.incidentSchemaCheckPromise) {
      this.incidentSchemaCheckPromise = this.checkIncidentSchema();
    }
    await this.incidentSchemaCheckPromise;
  }

  private async checkIncidentSchema() {
    const requiredColumns = [
      "steppe_area",
      "steppe_damage",
      "steppe_people_total",
      "steppe_people_dead",
      "steppe_people_injured",
      "steppe_animals_total",
      "steppe_animals_dead",
      "steppe_animals_injured",
      "steppe_extinguished_total",
      "steppe_extinguished_area",
      "steppe_extinguished_damage",
      "steppe_garrison_people",
      "steppe_garrison_units",
      "steppe_mchs_people",
      "steppe_mchs_units",
      "cause_code",
      "cause_detailed",
      "object_code",
      "object_detailed",
      "description",
      "building_details",
      "livestock_lost",
      "destroyed_items",
      "floor",
      "total_floors",
      "deaths_drunk",
      "deaths_co_total",
      "deaths_co_children",
      "injured_co_total",
      "injured_co_children",
      "saved_people_children",
      "time_of_day",
    ];

    try {
      const result = await db.execute(
        sql`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'incidents'`
      );
      const existingColumns = new Set(
        result.rows.map((row: { column_name: string }) => row.column_name)
      );
      this.missingIncidentColumns = requiredColumns.filter(
        (column) => !existingColumns.has(column)
      );

      if (this.missingIncidentColumns.length > 0) {
        console.warn(
          "[IncidentStorage] Missing incidents columns:",
          this.missingIncidentColumns
        );
      }
    } catch (error) {
      console.error("[IncidentStorage] Failed to check incidents schema:", error);
    }
  }

  getMissingIncidentColumns() {
    return this.missingIncidentColumns;
  }

  private getIncidentSelectFields() {
    const missing = new Set(this.missingIncidentColumns);
    const columnOrDefault = (columnName: string, column: unknown, fallback: unknown) =>
      missing.has(columnName) ? fallback : column;

    return {
      id: incidents.id,
      dateTime: incidents.dateTime,
      locality: incidents.locality,
      incidentType: incidents.incidentType,
      address: incidents.address,
      description: columnOrDefault("description", incidents.description, sql<string | null>`null`),
      cause: incidents.cause,
      causeCode: columnOrDefault("cause_code", incidents.causeCode, sql<string | null>`null`),
      causeDetailed: columnOrDefault("cause_detailed", incidents.causeDetailed, sql<string | null>`null`),
      objectType: incidents.objectType,
      objectCode: columnOrDefault("object_code", incidents.objectCode, sql<string | null>`null`),
      objectDetailed: columnOrDefault("object_detailed", incidents.objectDetailed, sql<string | null>`null`),
      region: incidents.region,
      city: incidents.city,
      damage: incidents.damage,
      steppeArea: columnOrDefault("steppe_area", incidents.steppeArea, sql<string>`0`),
      steppeDamage: columnOrDefault("steppe_damage", incidents.steppeDamage, sql<string>`0`),
      steppePeopleTotal: columnOrDefault("steppe_people_total", incidents.steppePeopleTotal, sql<number>`0`),
      steppePeopleDead: columnOrDefault("steppe_people_dead", incidents.steppePeopleDead, sql<number>`0`),
      steppePeopleInjured: columnOrDefault("steppe_people_injured", incidents.steppePeopleInjured, sql<number>`0`),
      steppeAnimalsTotal: columnOrDefault("steppe_animals_total", incidents.steppeAnimalsTotal, sql<number>`0`),
      steppeAnimalsDead: columnOrDefault("steppe_animals_dead", incidents.steppeAnimalsDead, sql<number>`0`),
      steppeAnimalsInjured: columnOrDefault("steppe_animals_injured", incidents.steppeAnimalsInjured, sql<number>`0`),
      steppeExtinguishedTotal: columnOrDefault(
        "steppe_extinguished_total",
        incidents.steppeExtinguishedTotal,
        sql<number>`0`
      ),
      steppeExtinguishedArea: columnOrDefault(
        "steppe_extinguished_area",
        incidents.steppeExtinguishedArea,
        sql<string>`0`
      ),
      steppeExtinguishedDamage: columnOrDefault(
        "steppe_extinguished_damage",
        incidents.steppeExtinguishedDamage,
        sql<string>`0`
      ),
      steppeGarrisonPeople: columnOrDefault(
        "steppe_garrison_people",
        incidents.steppeGarrisonPeople,
        sql<number>`0`
      ),
      steppeGarrisonUnits: columnOrDefault(
        "steppe_garrison_units",
        incidents.steppeGarrisonUnits,
        sql<number>`0`
      ),
      steppeMchsPeople: columnOrDefault("steppe_mchs_people", incidents.steppeMchsPeople, sql<number>`0`),
      steppeMchsUnits: columnOrDefault("steppe_mchs_units", incidents.steppeMchsUnits, sql<number>`0`),
      floor: columnOrDefault("floor", incidents.floor, sql<number | null>`null`),
      totalFloors: columnOrDefault("total_floors", incidents.totalFloors, sql<number | null>`null`),
      buildingDetails: columnOrDefault("building_details", incidents.buildingDetails, sql<unknown>`null`),
      livestockLost: columnOrDefault("livestock_lost", incidents.livestockLost, sql<unknown>`null`),
      destroyedItems: columnOrDefault("destroyed_items", incidents.destroyedItems, sql<unknown>`null`),
      deathsTotal: incidents.deathsTotal,
      deathsChildren: incidents.deathsChildren,
      deathsDrunk: columnOrDefault("deaths_drunk", incidents.deathsDrunk, sql<number>`0`),
      deathsCOTotal: columnOrDefault("deaths_co_total", incidents.deathsCOTotal, sql<number>`0`),
      deathsCOChildren: columnOrDefault("deaths_co_children", incidents.deathsCOChildren, sql<number>`0`),
      injuredTotal: incidents.injuredTotal,
      injuredChildren: incidents.injuredChildren,
      injuredCOTotal: columnOrDefault("injured_co_total", incidents.injuredCOTotal, sql<number>`0`),
      injuredCOChildren: columnOrDefault("injured_co_children", incidents.injuredCOChildren, sql<number>`0`),
      savedPeopleTotal: incidents.savedPeopleTotal,
      savedPeopleChildren: columnOrDefault("saved_people_children", incidents.savedPeopleChildren, sql<number>`0`),
      savedProperty: incidents.savedProperty,
      orgUnitId: incidents.orgUnitId,
      createdBy: incidents.createdBy,
      packageId: incidents.packageId,
      status: incidents.status,
      archivedAt: incidents.archivedAt,
      timeOfDay: columnOrDefault("time_of_day", incidents.timeOfDay, sql<string | null>`null`),
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
    };
  }

  private getPeriodKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  private createRegionDefaults<T extends string>(label: string, fields: T[]) {
    return fields.reduce(
      (acc, field) => {
        acc[field] = 0;
        return acc;
      },
      { label } as { label: string } & Record<T, number>
    );
  }

  private mergeRegionRows<T extends string>(
    rows: Array<{ label: string } & Record<T, number>>,
    fields: T[],
    sortBy: "count" | "label"
  ) {
    const merged = new Map<string, { label: string } & Record<T, number>>();

    for (const label of REGION_NAMES) {
      merged.set(label, this.createRegionDefaults(label, fields));
    }

    for (const row of rows) {
      const label = row.label;
      const entry = merged.get(label) ?? this.createRegionDefaults(label, fields);
      const updated = { ...entry };
      for (const field of fields) {
        updated[field] = Number(row[field]) || 0;
      }
      merged.set(label, updated);
    }

    const values = Array.from(merged.values());
    const compareLabel = (a: { label: string }, b: { label: string }) =>
      a.label.localeCompare(b.label, "ru");

    if (sortBy === "count") {
      values.sort(
        (a, b) => (b.count ?? 0) - (a.count ?? 0) || compareLabel(a, b)
      );
    } else {
      values.sort(compareLabel);
    }

    return values;
  }

  private getPeriodRange(period?: string) {
    const fallback = this.getPeriodKey(new Date());
    const [year, month] = (period ?? fallback).split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate, periodKey: `${year}-${String(month).padStart(2, "0")}` };
  }

  private getDateRange(params: { periodFrom?: string; periodTo?: string; period?: string }) {
    const fallback = this.getPeriodKey(new Date());
    const periodFrom = params.periodFrom ?? params.period ?? fallback;
    const periodTo = params.periodTo ?? periodFrom;
    const [startYear, startMonth] = periodFrom.split("-").map(Number);
    const [endYear, endMonth] = periodTo.split("-").map(Number);
    const startDate = new Date(startYear, startMonth - 1, 1);
    const endDate = new Date(endYear, endMonth, 0);
    endDate.setHours(23, 59, 59, 999);
    const monthsSpan = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

    return {
      startDate,
      endDate,
      periodFromKey: `${startYear}-${String(startMonth).padStart(2, "0")}`,
      periodToKey: `${endYear}-${String(endMonth).padStart(2, "0")}`,
      monthsSpan,
    };
  }

  private shiftPeriodKey(periodKey: string, offsetMonths: number) {
    const [year, month] = periodKey.split("-").map(Number);
    const date = new Date(year, month - 1 + offsetMonths, 1);
    return this.getPeriodKey(date);
  }

  private getPreviousPeriod(periodKey: string) {
    const [year, month] = periodKey.split("-").map(Number);
    const previousDate = new Date(year, month - 2, 1);
    return this.getPeriodKey(previousDate);
  }

  private async getOrganizationConditions(params: {
    orgUnitId?: string;
    includeSubOrgs?: boolean;
    scopeUser?: ScopeUser;
  }) {
    const conditions: any[] = [];

    if (params.orgUnitId) {
      if (params.includeSubOrgs) {
        const hierarchy = await orgStorage.getOrganizationHierarchy(params.orgUnitId);
        const orgIds = hierarchy.map((org) => org.id);
        conditions.push(inArray(incidents.orgUnitId, orgIds));
      } else {
        conditions.push(eq(incidents.orgUnitId, params.orgUnitId));
      }
    }

    if (params.scopeUser) {
      const scopeCondition = applyScopeCondition(params.scopeUser, incidents.region, incidents.city);
      if (scopeCondition) {
        conditions.push(scopeCondition);
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
    orgUnitId?: string;
    period?: string;
    includeSubOrgs?: boolean;
    scopeUser?: ScopeUser;
    limit?: number;
    offset?: number;
  }): Promise<
    | Incident[]
    | {
        items: Incident[];
        total: number;
        limit: number;
        offset: number;
      }
  > {
    await this.ensureIncidentSchemaChecked();
    const conditions: any[] = [];

    if (filters?.orgUnitId) {
      if (filters.includeSubOrgs) {
        const hierarchy = await orgStorage.getOrganizationHierarchy(filters.orgUnitId);
        const orgIds = hierarchy.map(o => o.id);
        if (orgIds.length > 0) {
          conditions.push(inArray(incidents.orgUnitId, orgIds));
        } else {
          // If no organizations found (which shouldn't happen for a valid orgId),
          // ensure we return nothing for safety
          conditions.push(sql`1 = 0`);
        }
      } else {
        conditions.push(eq(incidents.orgUnitId, filters.orgUnitId));
      }
    }

    if (filters?.period) {
      const [year, month] = filters.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    if (filters?.scopeUser) {
      const scopeCondition = applyScopeCondition(filters.scopeUser, incidents.region, incidents.city);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
    }

    const limit =
      typeof filters?.limit === "number" && Number.isFinite(filters.limit)
        ? Math.max(1, Math.floor(filters.limit))
        : undefined;
    const offset =
      typeof filters?.offset === "number" && Number.isFinite(filters.offset)
        ? Math.max(0, Math.floor(filters.offset))
        : 0;

    const selectFields = this.getIncidentSelectFields();
    const query = db.select(selectFields).from(incidents).orderBy(desc(incidents.dateTime));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    if (typeof limit === "number") {
      query.limit(limit);
      query.offset(offset);
    }

    const items = (await query) as Incident[];

    if (typeof limit === "number") {
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(incidents);

      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }

      const [countResult] = await countQuery;

      return {
        items,
        total: Number(countResult?.count) || 0,
        limit,
        offset,
      };
    }

    return items;
  }

  async getSimpleAnalytics(params: {
    orgUnitId?: string;
    period?: string;
    periodFrom?: string;
    periodTo?: string;
    includeSubOrgs?: boolean;
    region?: string;
    scopeUser?: ScopeUser;
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
    await this.ensureIncidentSchemaChecked();
    const conditions: any[] = await this.getOrganizationConditions(params);

    const { startDate, endDate } = this.getDateRange({
      periodFrom: params.periodFrom,
      periodTo: params.periodTo,
      period: params.period,
    });
    if (params.region) {
      conditions.push(eq(incidents.region, params.region));
    }
    conditions.push(gte(incidents.dateTime, startDate));
    conditions.push(lte(incidents.dateTime, endDate));

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
    orgUnitId?: string;
    period?: string;
    periodFrom?: string;
    periodTo?: string;
    includeSubOrgs?: boolean;
    region?: string;
    scopeUser?: ScopeUser;
  }) {
    await this.ensureIncidentSchemaChecked();
    const orgConditions = await this.getOrganizationConditions(params);
    const scopeConditions =
      params.region ? [...orgConditions, eq(incidents.region, params.region)] : orgConditions;
    const currentPeriod = this.getDateRange({
      periodFrom: params.periodFrom,
      periodTo: params.periodTo,
      period: params.period,
    });
    const previousPeriodFromKey = this.shiftPeriodKey(
      currentPeriod.periodFromKey,
      -currentPeriod.monthsSpan
    );
    const previousPeriodToKey = this.shiftPeriodKey(
      currentPeriod.periodToKey,
      -currentPeriod.monthsSpan
    );
    const previousPeriod = this.getDateRange({
      periodFrom: previousPeriodFromKey,
      periodTo: previousPeriodToKey,
    });
    const ospIncidentTypes = ["fire", "steppe_fire"] as const;

    const baseConditions = [
      ...scopeConditions,
      gte(incidents.dateTime, currentPeriod.startDate),
      lte(incidents.dateTime, currentPeriod.endDate),
    ];

    const labelOrFallback = (value?: string | null, fallback?: string | null) =>
      value || fallback || "Не указано";

    // NOTE: Imported data from reportForms is used in getReportFormData API, 
    // not here in analytics to avoid performance issues with heavy JOINs

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
          ...scopeConditions,
          inArray(incidents.incidentType, ospIncidentTypes),
          gte(incidents.dateTime, currentPeriod.startDate),
          lte(incidents.dateTime, currentPeriod.endDate)
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

    const form1RegionRows = await db
      .select({
        region: incidents.region,
        count: sql<number>`count(*)`,
        deaths: sql<number>`sum(deaths_total)`,
        injured: sql<number>`sum(injured_total)`,
        damage: sql<number>`sum(damage)`,
      })
      .from(incidents)
      .where(and(...baseConditions, inArray(incidents.incidentType, ospIncidentTypes)))
      .groupBy(incidents.region)
      .orderBy(sql`count(*) DESC`);

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
          ...scopeConditions,
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

    // --- FORM 5 DETAILED STATS (Aggregated from incident_victims) ---
    // This query joins incidents and incident_victims to get detailed breakdown for fire deaths/injuries
    let form5Victims: {
      gender: string;
      ageGroup: string;
      socialStatus: string | null;
      condition: string | null;
      deathCause: string | null;
      deathPlace: string | null;
      status: string;
      count: number;
    }[] = [];

    try {
      form5Victims = await db
        .select({
          gender: incidentVictims.gender,
          ageGroup: incidentVictims.ageGroup,
          socialStatus: incidentVictims.socialStatus,
          condition: incidentVictims.condition,
          deathCause: incidentVictims.deathCause,
          deathPlace: incidentVictims.deathPlace,
          status: incidentVictims.status,
          count: sql<number>`count(*)`,
        })
        .from(incidentVictims)
        .innerJoin(incidents, eq(incidents.id, incidentVictims.incidentId))
        .where(
          and(
            ...baseConditions,
            eq(incidents.incidentType, "fire"),
            or(eq(incidentVictims.status, "dead"), eq(incidentVictims.status, "injured"))
          )
        )
        .groupBy(
          incidentVictims.gender,
          incidentVictims.ageGroup,
          incidentVictims.socialStatus,
          incidentVictims.condition,
          incidentVictims.deathCause,
          incidentVictims.deathPlace,
          incidentVictims.status
        );
    } catch (error) {
      console.error("[IncidentStorage] Failed to load form5 victims:", error);
    }

    const steppeTypes = ["steppe_fire", "steppe_smolder"] as const;

    const form6MonthlyRows = await db
      .select({
        month: sql<string>`to_char(date_time, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
        steppeArea: sql<number>`sum(steppe_area)`,
        steppeDamage: sql<number>`sum(steppe_damage)`,
        peopleTotal: sql<number>`sum(steppe_people_total)`,
        peopleDead: sql<number>`sum(steppe_people_dead)`,
        peopleInjured: sql<number>`sum(steppe_people_injured)`,
        animalsTotal: sql<number>`sum(steppe_animals_total)`,
        animalsDead: sql<number>`sum(steppe_animals_dead)`,
        animalsInjured: sql<number>`sum(steppe_animals_injured)`,
        extinguishedTotal: sql<number>`sum(steppe_extinguished_total)`,
        extinguishedArea: sql<number>`sum(steppe_extinguished_area)`,
        extinguishedDamage: sql<number>`sum(steppe_extinguished_damage)`,
        garrisonPeople: sql<number>`sum(steppe_garrison_people)`,
        garrisonUnits: sql<number>`sum(steppe_garrison_units)`,
        mchsPeople: sql<number>`sum(steppe_mchs_people)`,
        mchsUnits: sql<number>`sum(steppe_mchs_units)`,
      })
      .from(incidents)
      .where(
        and(
          ...orgConditions,
          inArray(incidents.incidentType, steppeTypes),
          gte(incidents.dateTime, currentPeriod.startDate),
          lte(incidents.dateTime, currentPeriod.endDate)
        )
      )
      .groupBy(sql`to_char(date_time, 'YYYY-MM')`)
      .orderBy(sql`to_char(date_time, 'YYYY-MM')`);

    const form6RegionRows = await db
      .select({
        region: incidents.region,
        count: sql<number>`count(*)`,
        steppeArea: sql<number>`sum(steppe_area)`,
        steppeDamage: sql<number>`sum(steppe_damage)`,
        peopleTotal: sql<number>`sum(steppe_people_total)`,
        peopleDead: sql<number>`sum(steppe_people_dead)`,
        peopleInjured: sql<number>`sum(steppe_people_injured)`,
        animalsTotal: sql<number>`sum(steppe_animals_total)`,
        animalsDead: sql<number>`sum(steppe_animals_dead)`,
        animalsInjured: sql<number>`sum(steppe_animals_injured)`,
        extinguishedTotal: sql<number>`sum(steppe_extinguished_total)`,
        extinguishedArea: sql<number>`sum(steppe_extinguished_area)`,
        extinguishedDamage: sql<number>`sum(steppe_extinguished_damage)`,
        garrisonPeople: sql<number>`sum(steppe_garrison_people)`,
        garrisonUnits: sql<number>`sum(steppe_garrison_units)`,
        mchsPeople: sql<number>`sum(steppe_mchs_people)`,
        mchsUnits: sql<number>`sum(steppe_mchs_units)`,
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

    // --- FORM 7 DETAILED STATS (Aggregated from incident_victims) ---
    let form7Victims: {
      gender: string;
      ageGroup: string;
      socialStatus: string | null;
      condition: string | null;
      deathCause: string | null;
      deathPlace: string | null;
      status: string;
      incidentObjectCode: string | null;
      incidentDateTime: Date;
      count: number;
    }[] = [];

    try {
      form7Victims = await db
        .select({
          gender: incidentVictims.gender,
          ageGroup: incidentVictims.ageGroup,
          socialStatus: incidentVictims.socialStatus,
          condition: incidentVictims.condition,
          deathCause: incidentVictims.deathCause,
          deathPlace: incidentVictims.deathPlace,
          status: incidentVictims.status,
          incidentObjectCode: incidents.objectCode,
          incidentDateTime: incidents.dateTime,
          count: sql<number>`count(*)`,
        })
        .from(incidentVictims)
        .innerJoin(incidents, eq(incidents.id, incidentVictims.incidentId))
        .where(
          and(
            ...baseConditions,
            eq(incidents.incidentType, "co_nofire"),
            or(eq(incidentVictims.status, "dead"), eq(incidentVictims.status, "injured"))
          )
        )
        .groupBy(
          incidentVictims.gender,
          incidentVictims.ageGroup,
          incidentVictims.socialStatus,
          incidentVictims.condition,
          incidentVictims.deathCause,
          incidentVictims.deathPlace,
          incidentVictims.status,
          incidents.objectCode,
          incidents.dateTime
        );
    } catch (error) {
      console.error("[IncidentStorage] Failed to load form7 victims:", error);
    }

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
    const form1Regions = this.mergeRegionRows(
      form1RegionRows.map((row) => ({
        label: row.region ?? "Не указан",
        count: Number(row.count) || 0,
        deaths: Number(row.deaths) || 0,
        injured: Number(row.injured) || 0,
        damage: Number(row.damage) || 0,
      })),
      ["count", "deaths", "injured", "damage"],
      "count"
    );
    const form2Regions = this.mergeRegionRows(
      form2RegionRows.map((row) => ({
        label: row.region ?? "Не указан",
        count: Number(row.count) || 0,
      })),
      ["count"],
      "label"
    );
    const form6Regions = this.mergeRegionRows(
      form6RegionRows.map((row) => ({
        label: row.region ?? "Не указан",
        count: Number(row.count) || 0,
        steppeArea: Number(row.steppeArea) || 0,
        steppeDamage: Number(row.steppeDamage) || 0,
        peopleTotal: Number(row.peopleTotal) || 0,
        peopleDead: Number(row.peopleDead) || 0,
        peopleInjured: Number(row.peopleInjured) || 0,
        animalsTotal: Number(row.animalsTotal) || 0,
        animalsDead: Number(row.animalsDead) || 0,
        animalsInjured: Number(row.animalsInjured) || 0,
        extinguishedTotal: Number(row.extinguishedTotal) || 0,
        extinguishedArea: Number(row.extinguishedArea) || 0,
        extinguishedDamage: Number(row.extinguishedDamage) || 0,
        garrisonPeople: Number(row.garrisonPeople) || 0,
        garrisonUnits: Number(row.garrisonUnits) || 0,
        mchsPeople: Number(row.mchsPeople) || 0,
        mchsUnits: Number(row.mchsUnits) || 0,
      })),
      [
        "count",
        "steppeArea",
        "steppeDamage",
        "peopleTotal",
        "peopleDead",
        "peopleInjured",
        "animalsTotal",
        "animalsDead",
        "animalsInjured",
        "extinguishedTotal",
        "extinguishedArea",
        "extinguishedDamage",
        "garrisonPeople",
        "garrisonUnits",
        "mchsPeople",
        "mchsUnits",
      ],
      "label"
    );
    const form7Regions = this.mergeRegionRows(
      form7RegionRows.map((row) => ({
        label: row.region ?? "Не указан",
        count: Number(row.count) || 0,
        deaths: Number(row.deaths) || 0,
        injured: Number(row.injured) || 0,
      })),
      ["count", "deaths", "injured"],
      "label"
    );

    const periodLabel =
      currentPeriod.periodFromKey === currentPeriod.periodToKey
        ? currentPeriod.periodFromKey
        : `${currentPeriod.periodFromKey} — ${currentPeriod.periodToKey}`;

    return {
      period: periodLabel,
      form1: {
        monthly: form1MonthlyRows.map((row) => ({
          month: row.month,
          count: Number(row.count) || 0,
          deaths: Number(row.deaths) || 0,
          injured: Number(row.injured) || 0,
          damage: Number(row.damage) || 0,
        })),
        locality: form1LocalityRows.map((row) => {
          const locality = this.normalizeLocalityValue(row.locality);
          return {
            locality: locality ?? "unknown",
            label: locality === "cities" ? "Город" : locality === "rural" ? "Село" : "Не указано",
            count: Number(row.count) || 0,
            deaths: Number(row.deaths) || 0,
            injured: Number(row.injured) || 0,
            damage: Number(row.damage) || 0,
          };
        }),
        regions: form1Regions,
        totals: form1Totals,
      },
      form2: {
        causes: form2Causes,
        regions: form2Regions,
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
        locality: form5LocalityRows.map((row) => {
          const locality = this.normalizeLocalityValue(row.locality);
          return {
            locality: locality ?? "unknown",
            label: locality === "cities" ? "Город" : locality === "rural" ? "Село" : "Не указано",
            count: Number(row.count) || 0,
            damage: Number(row.damage) || 0,
          };
        }),
        details: {
          social: this.aggregateLabelSeries(form5Victims, v => v.socialStatus || "unknown"),
          causes: this.aggregateLabelSeries(form5Victims, v => v.deathCause || "unknown"),
          conditions: this.aggregateLabelSeries(form5Victims, v => v.condition || "unknown"),
          places: this.aggregateLabelSeries(form5Victims, v => v.deathPlace || "unknown"),
        }
      },
      form6: {
        monthly: form6MonthlyRows.map((row) => ({
          month: row.month,
          count: Number(row.count) || 0,
          steppeArea: Number(row.steppeArea) || 0,
          steppeDamage: Number(row.steppeDamage) || 0,
          peopleTotal: Number(row.peopleTotal) || 0,
          peopleDead: Number(row.peopleDead) || 0,
          peopleInjured: Number(row.peopleInjured) || 0,
          animalsTotal: Number(row.animalsTotal) || 0,
          animalsDead: Number(row.animalsDead) || 0,
          animalsInjured: Number(row.animalsInjured) || 0,
          extinguishedTotal: Number(row.extinguishedTotal) || 0,
          extinguishedArea: Number(row.extinguishedArea) || 0,
          extinguishedDamage: Number(row.extinguishedDamage) || 0,
          garrisonPeople: Number(row.garrisonPeople) || 0,
          garrisonUnits: Number(row.garrisonUnits) || 0,
          mchsPeople: Number(row.mchsPeople) || 0,
          mchsUnits: Number(row.mchsUnits) || 0,
        })),
        regions: form6Regions,
      },
      form7: {
        totals: form7Totals,
        regions: form7Regions,
        details: {
          social: this.aggregateLabelSeries(form7Victims, v => v.socialStatus || "unknown"),
          conditions: this.aggregateLabelSeries(form7Victims, v => v.condition || "unknown"),
          places: this.aggregateLabelSeries(form7Victims, v => v.deathPlace || "unknown"),
          causes: this.aggregateLabelSeries(form7Victims, v => v.deathCause || "unknown"),
        }
      },
    };
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    await this.ensureIncidentSchemaChecked();
    const selectFields = this.getIncidentSelectFields();
    const [incident] = await db.select(selectFields).from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(incidentData: InsertIncident & { victims?: InsertIncidentVictim[] }): Promise<Incident> {
    await this.ensureIncidentSchemaChecked();
    const { victims, ...data } = incidentData;
    const normalizedData = {
      ...data,
      causeCode: data.causeCode ?? data.cause,
      objectCode: data.objectCode ?? data.objectType,
    };
    const [incident] = await db.insert(incidents).values(normalizedData as any).returning();

    if (victims && victims.length > 0) {
      const victimsWithId = victims.map(v => ({ ...v, incidentId: incident.id }));
      await db.insert(incidentVictims).values(victimsWithId);
    }

    return incident as Incident;
  }

  async updateIncident(id: string, incidentData: Partial<InsertIncident> & { victims?: InsertIncidentVictim[] }): Promise<Incident> {
    await this.ensureIncidentSchemaChecked();
    const { victims, ...data } = incidentData;
    const updateData = {
      ...data,
      causeCode: data.causeCode ?? data.cause,
      objectCode: data.objectCode ?? data.objectType,
      updatedAt: new Date(),
    };

    const [incident] = await db
      .update(incidents)
      .set(updateData as any)
      .where(eq(incidents.id, id))
      .returning();

    if (victims) {
      // Replace all victims for simplicity (or we could smart diff, but this is safer for consistency)
      await db.delete(incidentVictims).where(eq(incidentVictims.incidentId, id));
      if (victims.length > 0) {
        const victimsWithId = victims.map(v => ({ ...v, incidentId: incident.id }));
        await db.insert(incidentVictims).values(victimsWithId);
      }
    }

    return incident as Incident;
  }

  async getIncidentVictims(incidentId: string) {
    await this.ensureIncidentSchemaChecked();
    return await db.select().from(incidentVictims).where(eq(incidentVictims.incidentId, incidentId));
  }

  async deleteIncident(id: string): Promise<void> {
    await this.ensureIncidentSchemaChecked();
    await db.delete(incidents).where(eq(incidents.id, id));
  }

  async getIncidentStats(params: {
    orgUnitId?: string;
    period?: string;
    includeSubOrgs?: boolean;
    scopeUser?: ScopeUser;
  }): Promise<{
    totalIncidents: number;
    totalDeaths: number;
    totalInjured: number;
    totalDamage: number;
  }> {
    await this.ensureIncidentSchemaChecked();
    const conditions = await this.getOrganizationConditions({
      orgUnitId: params.orgUnitId,
      includeSubOrgs: params.includeSubOrgs,
      scopeUser: params.scopeUser,
    });

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
        totalDeaths: sql<number>`sum(${incidents.deathsTotal})`,
        totalInjured: sql<number>`sum(${incidents.injuredTotal})`,
        totalDamage: sql<number>`sum(${incidents.damage})`,
      })
      .from(incidents);

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const [result] = await query;

    return {
      totalIncidents: Number(result.totalIncidents) || 0,
      totalDeaths: Number(result.totalDeaths) || 0,
      totalInjured: Number(result.totalInjured) || 0,
      totalDamage: Number(result.totalDamage) || 0,
    };
  }

  async getIncidentsCount(): Promise<number> {
    await this.ensureIncidentSchemaChecked();
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(incidents);
    return Number(countResult?.count) || 0;
  }

  async searchIncidents(
    query: string,
    filters: {
      orgUnitId?: string;
      includeSubOrgs?: boolean;
      region?: string;
      district?: string;
      incidentType?: string;
      dateFrom?: string | Date;
      dateTo?: string | Date;
      scopeUser?: ScopeUser;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<
    | any[]
    | {
        items: any[];
        total: number;
        limit: number;
        offset: number;
      }
  > {
    await this.ensureIncidentSchemaChecked();
    const conditions = [];

    if (query) {
      conditions.push(
        or(
          ilike(incidents.address, `%${query}%`),
          ilike(incidents.description, `%${query}%`)
        )
      );
    }

    if (filters.orgUnitId) {
      if (filters.includeSubOrgs) {
        const hierarchy = await orgStorage.getOrganizationHierarchy(filters.orgUnitId);
        const orgIds = hierarchy.map(o => o.id);
        if (orgIds.length > 0) {
          conditions.push(inArray(incidents.orgUnitId, orgIds));
        } else {
          conditions.push(sql`1 = 0`);
        }
      } else {
        conditions.push(eq(incidents.orgUnitId, filters.orgUnitId));
      }
    }

    if (filters.region) conditions.push(eq(incidents.region, filters.region));
    if (filters.district) conditions.push(eq(incidents.district, filters.district));
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

    if (filters.scopeUser) {
      const scopeCondition = applyScopeCondition(filters.scopeUser, incidents.region, incidents.city);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
    }

    const limit =
      typeof filters.limit === "number" && Number.isFinite(filters.limit)
        ? Math.max(1, Math.floor(filters.limit))
        : undefined;
    const offset =
      typeof filters.offset === "number" && Number.isFinite(filters.offset)
        ? Math.max(0, Math.floor(filters.offset))
        : 0;

    const selectFields = this.getIncidentSelectFields();
    const queryBuilder = db.select(selectFields).from(incidents).orderBy(desc(incidents.dateTime));

    if (conditions.length > 0) {
      queryBuilder.where(and(...conditions));
    }

    if (typeof limit === "number") {
      queryBuilder.limit(limit);
      queryBuilder.offset(offset);
    }

    const items = await queryBuilder;

    if (typeof limit === "number") {
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(incidents);

      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }

      const [countResult] = await countQuery;

      return {
        items,
        total: Number(countResult?.count) || 0,
        limit,
        offset,
      };
    }

    return items as any[];
  }

  // Advanced Analytics (Charts/Maps)
  async getAdvancedAnalytics(params: any): Promise<any> {
    await this.ensureIncidentSchemaChecked();
    const { period, orgUnitId, includeSubOrgs, scopeUser, region } = params;
    const scopeConditions = await this.getOrganizationConditions({
      orgUnitId,
      includeSubOrgs,
      scopeUser,
    });
    if (region) {
      scopeConditions.push(eq(incidents.region, region));
    }

    // Статистика по типам происшествий
    const incidentTypesQuery = db.select({
      type: incidents.incidentType,
      count: sql<number>`count(*)`,
      damage: sql<number>`sum(damage)`
    })
    .from(incidents);

    if (scopeConditions.length > 0) {
      incidentTypesQuery.where(and(...scopeConditions));
    }

    const incidentTypes = await incidentTypesQuery.groupBy(incidents.incidentType);

    // Статистика по регионам
    const regionStatsQuery = db.select({
      region: incidents.region,
      count: sql<number>`count(*)`,
      deaths: sql<number>`sum(deaths_total)`,
      damage: sql<number>`sum(damage)`
    })
    .from(incidents);

    if (scopeConditions.length > 0) {
      regionStatsQuery.where(and(...scopeConditions));
    }

    const regionStats = await regionStatsQuery.groupBy(incidents.region);
    const mergedRegionStats = this.mergeRegionRows(
      regionStats.map((row) => ({
        label: row.region ?? "Не указан",
        count: Number(row.count) || 0,
        deaths: Number(row.deaths) || 0,
        damage: Number(row.damage) || 0,
      })),
      ["count", "deaths", "damage"],
      "label"
    ).map(({ label, ...rest }) => ({ region: label, ...rest }));

    // Временная динамика
    const monthlyStatsQuery = db.select({
      month: sql<string>`to_char(date_time, 'YYYY-MM')`,
      count: sql<number>`count(*)`,
      damage: sql<number>`sum(damage)`
    })
    .from(incidents);

    if (scopeConditions.length > 0) {
      monthlyStatsQuery.where(and(...scopeConditions));
    }

    const monthlyStats = await monthlyStatsQuery
      .groupBy(sql`to_char(date_time, 'YYYY-MM')`)
      .orderBy(sql`to_char(date_time, 'YYYY-MM')`);

    return {
      incidentTypes,
      regionStats: mergedRegionStats,
      monthlyStats,
      summary: {
        totalIncidents: incidentTypes.reduce((sum, item) => sum + Number(item.count), 0),
        totalDamage: mergedRegionStats.reduce((sum, item) => sum + Number(item.damage || 0), 0),
        totalDeaths: mergedRegionStats.reduce((sum, item) => sum + Number(item.deaths || 0), 0)
      }
    };
  }

  private async getReportDataset(params: {
    orgId: string;
    period?: string;
    region?: string;
    includeChildren?: boolean;
    scopeUser?: ScopeUser;
  }) {
    await this.ensureIncidentSchemaChecked();
    const conditions: any[] = await this.getOrganizationConditions({
      orgUnitId: params.orgId,
      includeSubOrgs: params.includeChildren,
      scopeUser: params.scopeUser,
    });

    if (params.period) {
      const [year, month] = params.period.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }

    if (params.region && params.region !== "Республика Казахстан (Свод)") {
      conditions.push(eq(incidents.region, params.region));
    }

    const incidentRows = await db
      .select({
        id: incidents.id,
        incidentType: incidents.incidentType,
        locality: incidents.locality,
        region: incidents.region,
        dateTime: incidents.dateTime,
        timeOfDay: incidents.timeOfDay,
        causeCode: incidents.causeCode,
        causeDetailed: incidents.causeDetailed,
        objectCode: incidents.objectCode,
        objectDetailed: incidents.objectDetailed,
        damage: incidents.damage,
        deathsTotal: incidents.deathsTotal,
        deathsChildren: incidents.deathsChildren,
        deathsDrunk: incidents.deathsDrunk,
        deathsCOTotal: incidents.deathsCOTotal,
        deathsCOChildren: incidents.deathsCOChildren,
        injuredTotal: incidents.injuredTotal,
        injuredChildren: incidents.injuredChildren,
        injuredCOTotal: incidents.injuredCOTotal,
        injuredCOChildren: incidents.injuredCOChildren,
        savedPeopleTotal: incidents.savedPeopleTotal,
        savedPeopleChildren: incidents.savedPeopleChildren,
        savedProperty: incidents.savedProperty,
        livestockLost: incidents.livestockLost,
        destroyedItems: incidents.destroyedItems,
        steppeArea: incidents.steppeArea,
        steppeDamage: incidents.steppeDamage,
        steppePeopleTotal: incidents.steppePeopleTotal,
        steppePeopleDead: incidents.steppePeopleDead,
        steppePeopleInjured: incidents.steppePeopleInjured,
        steppeAnimalsTotal: incidents.steppeAnimalsTotal,
        steppeAnimalsDead: incidents.steppeAnimalsDead,
        steppeAnimalsInjured: incidents.steppeAnimalsInjured,
        steppeExtinguishedTotal: incidents.steppeExtinguishedTotal,
        steppeExtinguishedArea: incidents.steppeExtinguishedArea,
        steppeExtinguishedDamage: incidents.steppeExtinguishedDamage,
        steppeGarrisonPeople: incidents.steppeGarrisonPeople,
        steppeGarrisonUnits: incidents.steppeGarrisonUnits,
        steppeMchsPeople: incidents.steppeMchsPeople,
        steppeMchsUnits: incidents.steppeMchsUnits,
      })
      .from(incidents)
      .where(and(...conditions));

    const incidentIds = incidentRows.map((row) => row.id);
    const victimRows = incidentIds.length
      ? await db
          .select({
            incidentId: incidentVictims.incidentId,
            gender: incidentVictims.gender,
            ageGroup: incidentVictims.ageGroup,
            status: incidentVictims.status,
            victimType: incidentVictims.victimType,
            socialStatus: incidentVictims.socialStatus,
            deathCause: incidentVictims.deathCause,
            deathPlace: incidentVictims.deathPlace,
            condition: incidentVictims.condition,
          })
          .from(incidentVictims)
          .where(inArray(incidentVictims.incidentId, incidentIds))
      : [];

    return { incidentRows, victimRows };
  }

  async getReportFormData(params: {
    orgId: string;
    period?: string;
    form?: string;
    region?: string;
    includeChildren?: boolean;
    scopeUser?: ScopeUser;
  }): Promise<any> {
    const { incidentRows, victimRows } = await this.getReportDataset(params);

    const fireIncidents = incidentRows.filter((incident) =>
      ["fire", "steppe_fire", "nonfire", "steppe_smolder", "co_nofire"].includes(incident.incidentType ?? "")
    );
    const sumByLocality = (
      incidentsList: typeof incidentRows,
      valueGetter: (incident: (typeof incidentRows)[number]) => number
    ) => {
      return incidentsList.reduce(
        (acc, incident) => {
          const value = valueGetter(incident);
          acc.total += value;
          if (this.normalizeLocalityValue(incident.locality) === "cities") {
            acc.urban += value;
          } else if (this.normalizeLocalityValue(incident.locality) === "rural") {
            acc.rural += value;
          }
          return acc;
        },
        { total: 0, urban: 0, rural: 0 }
      );
    };

    switch (params.form) {
      case "1-osp": {
        // First check if there's imported data in reportForms for this period
        const importedForms = await db
          .select({
            data: reportForms.data,
            regionName: orgUnits.regionName,
          })
          .from(reportForms)
          .innerJoin(orgUnits, eq(reportForms.orgUnitId, orgUnits.id))
          .where(
            and(
              eq(reportForms.form, "1-osp"),
              eq(reportForms.period, params.period || "")
            )
          );

        // If we have imported data, aggregate it
        if (importedForms.length > 0) {
          // For "Республика Казахстан (Свод)" aggregate all regions
          // Otherwise filter by specific region
          const relevantForms = params.region && params.region !== "Республика Казахстан (Свод)"
            ? importedForms.filter(f => f.regionName === params.region)
            : importedForms;

          if (relevantForms.length > 0) {
            const aggregatedValues: Record<string, { total: number; urban: number; rural: number }> = {};
            
            // Aggregate values from all matching report forms
            for (const form of relevantForms) {
              const data = form.data as Record<string, number>;
              if (!data) continue;

              // Map imported data fields to form row IDs
              const mapping: Record<string, { totalKey: string; urbanKey: string; ruralKey: string }> = {
                "1": { totalKey: "fires_total", urbanKey: "fires_cities", ruralKey: "fires_rural" },
                "2": { totalKey: "damage_total", urbanKey: "damage_cities", ruralKey: "damage_rural" },
                "3": { totalKey: "deaths_total", urbanKey: "deaths_cities", ruralKey: "deaths_rural" },
                "3.1": { totalKey: "deaths_children", urbanKey: "deaths_children", ruralKey: "deaths_children" },
                "3.2": { totalKey: "deaths_drunk", urbanKey: "deaths_drunk", ruralKey: "deaths_drunk" },
                "4": { totalKey: "deaths_co_total", urbanKey: "deaths_co_total", ruralKey: "deaths_co_total" },
                "4.1": { totalKey: "deaths_co_children", urbanKey: "deaths_co_children", ruralKey: "deaths_co_children" },
                "5": { totalKey: "injured_total", urbanKey: "injured_total", ruralKey: "injured_total" },
                "5.1": { totalKey: "injured_children", urbanKey: "injured_children", ruralKey: "injured_children" },
                "6": { totalKey: "injured_co_total", urbanKey: "injured_co_total", ruralKey: "injured_co_total" },
                "6.1": { totalKey: "injured_co_children", urbanKey: "injured_co_children", ruralKey: "injured_co_children" },
                "7": { totalKey: "saved_people_total", urbanKey: "saved_people_total", ruralKey: "saved_people_total" },
                "7.1": { totalKey: "saved_children", urbanKey: "saved_children", ruralKey: "saved_children" },
                "8": { totalKey: "saved_property", urbanKey: "saved_property", ruralKey: "saved_property" },
              };

              for (const [rowId, keys] of Object.entries(mapping)) {
                if (!aggregatedValues[rowId]) {
                  aggregatedValues[rowId] = { total: 0, urban: 0, rural: 0 };
                }
                aggregatedValues[rowId].total += Number(data[keys.totalKey] || 0);
                aggregatedValues[rowId].urban += Number(data[keys.urbanKey] || 0);
                aggregatedValues[rowId].rural += Number(data[keys.ruralKey] || 0);
              }
            }

            const attachValuesFromImported = (rows: typeof FORM_1_OSP_ROWS): any[] =>
              rows.map((row) => ({
                ...row,
                values: aggregatedValues[row.id] ?? { total: 0, urban: 0, rural: 0 },
                children: row.children ? attachValuesFromImported(row.children) : undefined,
              }));

            return {
              form: params.form,
              period: params.period,
              rows: attachValuesFromImported(FORM_1_OSP_ROWS),
            };
          }
        }

        // Fallback to incident-based aggregation
        const coIncidents = incidentRows.filter((incident) => incident.incidentType === "co_nofire");
        const fireIncidentsForForm1 = incidentRows.filter((incident) => 
          ["fire", "steppe_fire", "nonfire", "steppe_smolder", "co_nofire"].includes(incident.incidentType ?? "")
        );
        const values: Record<string, { total: number; urban: number; rural: number }> = {};

        values["1"] = sumByLocality(fireIncidentsForForm1, () => 1);
        values["2"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.damage || 0));
        values["3"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.deathsTotal || 0));
        values["3.1"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.deathsChildren || 0));
        values["3.2"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.deathsDrunk || 0));
        values["4"] = sumByLocality(coIncidents, (incident) => Number(incident.deathsCOTotal || 0));
        values["4.1"] = sumByLocality(coIncidents, (incident) => Number(incident.deathsCOChildren || 0));
        values["5"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.injuredTotal || 0));
        values["5.1"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.injuredChildren || 0));
        values["6"] = sumByLocality(coIncidents, (incident) => Number(incident.injuredCOTotal || 0));
        values["6.1"] = sumByLocality(coIncidents, (incident) => Number(incident.injuredCOChildren || 0));
        values["7"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.savedPeopleTotal || 0));
        values["7.1"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.savedPeopleChildren || 0));
        values["8"] = sumByLocality(fireIncidentsForForm1, (incident) => Number(incident.savedProperty || 0));

        const attachValues = (rows: typeof FORM_1_OSP_ROWS) =>
          rows.map((row) => ({
            ...row,
            values: values[row.id] ?? { total: 0, urban: 0, rural: 0 },
            children: row.children ? attachValues(row.children) : undefined,
          }));

        return {
          form: params.form,
          period: params.period,
          rows: attachValues(FORM_1_OSP_ROWS),
        };
      }
      case "2-ssg": {
        const nonfireIncidents = incidentRows.filter((incident) => incident.incidentType === "nonfire");
        const counts = new Map<string, number>();
        nonfireIncidents.forEach((incident) => {
          const code = incident.causeCode || incident.causeDetailed;
          if (!code) {
            return;
          }
          counts.set(code, (counts.get(code) ?? 0) + 1);
        });
        return {
          form: params.form,
          period: params.period,
          rows: NON_FIRE_CASES.map((item) => ({
            ...item,
            value: counts.get(item.code) ?? 0,
          })),
        };
      }
      case "3-spvp": {
        const byCause = new Map<string, { count: number; damage: number }>();
        const byDetail = new Map<string, { count: number; damage: number }>();
        fireIncidents.forEach((incident) => {
          const damageValue = Number(incident.damage || 0);
          if (incident.causeCode) {
            const existing = byCause.get(incident.causeCode) ?? { count: 0, damage: 0 };
            existing.count += 1;
            existing.damage += damageValue;
            byCause.set(incident.causeCode, existing);
          }
          if (incident.causeDetailed) {
            const existing = byDetail.get(incident.causeDetailed) ?? { count: 0, damage: 0 };
            existing.count += 1;
            existing.damage += damageValue;
            byDetail.set(incident.causeDetailed, existing);
          }
        });
        const attachValues = (rows: typeof FIRE_CAUSES) =>
          rows.map((row) => {
            const source = row.code.includes(".") ? byDetail.get(row.code) : byCause.get(row.code);
            return {
              ...row,
              values: {
                fires_total: source?.count ?? 0,
                fires_high_risk: 0,
                damage_total: source?.damage ?? 0,
                damage_high_risk: 0,
              },
              children: row.children ? attachValues(row.children) : undefined,
            };
          });

        return {
          form: params.form,
          period: params.period,
          rows: attachValues(FIRE_CAUSES),
        };
      }
      case "4-sovp": {
        const byObject = new Map<string, { count: number; damage: number; deaths: number; injuries: number }>();
        const byDetail = new Map<string, { count: number; damage: number; deaths: number; injuries: number }>();
        fireIncidents.forEach((incident) => {
          const damageValue = Number(incident.damage || 0);
          const deathsValue = Number(incident.deathsTotal || 0);
          const injuriesValue = Number(incident.injuredTotal || 0);
          if (incident.objectCode) {
            const existing = byObject.get(incident.objectCode) ?? { count: 0, damage: 0, deaths: 0, injuries: 0 };
            existing.count += 1;
            existing.damage += damageValue;
            existing.deaths += deathsValue;
            existing.injuries += injuriesValue;
            byObject.set(incident.objectCode, existing);
          }
          if (incident.objectDetailed) {
            const existing = byDetail.get(incident.objectDetailed) ?? { count: 0, damage: 0, deaths: 0, injuries: 0 };
            existing.count += 1;
            existing.damage += damageValue;
            existing.deaths += deathsValue;
            existing.injuries += injuriesValue;
            byDetail.set(incident.objectDetailed, existing);
          }
        });
        const attachValues = (rows: typeof FORM_4_SOVP_ROWS) =>
          rows.map((row) => {
            const source = row.id.includes(".") ? byDetail.get(row.id) : byObject.get(row.id);
            return {
              ...row,
              values: {
                fires_total: source?.count ?? 0,
                damage_total: source?.damage ?? 0,
                deaths_total: source?.deaths ?? 0,
                injuries_total: source?.injuries ?? 0,
              },
              children: row.children ? attachValues(row.children) : undefined,
            };
          });

        return {
          form: params.form,
          period: params.period,
          rows: attachValues(FORM_4_SOVP_ROWS),
        };
      }
      case "5-spzs": {
        const isResidential = (incident: (typeof incidentRows)[number]) => {
          const code = incident.objectCode ?? "";
          const detailed = incident.objectDetailed ?? "";
          return code.startsWith("14") || detailed.startsWith("14");
        };
        const residentialIncidents = fireIncidents.filter(isResidential);
        const incidentLocality = new Map(residentialIncidents.map((incident) => [incident.id, incident.locality]));

        const values: Record<string, { urban: number; rural: number }> = {};
        const addValue = (rowId: string, locality: string | null | undefined, amount: number) => {
          const existing = values[rowId] ?? { urban: 0, rural: 0 };
          if (this.normalizeLocalityValue(locality) === "cities") {
            existing.urban += amount;
          } else if (this.normalizeLocalityValue(locality) === "rural") {
            existing.rural += amount;
          }
          values[rowId] = existing;
        };

        const addFromIncidents = (rowId: string, getter: (incident: (typeof incidentRows)[number]) => number) => {
          residentialIncidents.forEach((incident) => {
            addValue(rowId, incident.locality, getter(incident));
          });
        };

        addFromIncidents("1", () => 1);
        addFromIncidents("1.1", (incident) => Number(incident.damage || 0));
        addFromIncidents("2", (incident) => Number(incident.deathsTotal || 0));
        addFromIncidents("2.3", (incident) => Number(incident.deathsChildren || 0));
        addFromIncidents("3", (incident) => Number(incident.injuredTotal || 0));
        addFromIncidents("3.3", (incident) => Number(incident.injuredChildren || 0));
        addFromIncidents("4", (incident) => Number(incident.savedPeopleTotal || 0));
        addFromIncidents("4.1", (incident) => Number(incident.savedPeopleChildren || 0));
        addFromIncidents("5", (incident) => Number(incident.savedProperty || 0));

        const livestockMap: Record<string, string> = {
          cows: "6.1.1",
          sheep: "6.2.1",
          horse: "6.3.1",
          camel: "6.4.1",
          pig: "6.5.1",
          rodents: "6.6.1",
          birds: "6.7.1",
        };

        residentialIncidents.forEach((incident) => {
          const livestock = incident.livestockLost as Record<string, number> | null | undefined;
          if (livestock) {
            Object.entries(livestockMap).forEach(([key, rowId]) => {
              const value = Number(livestock[key] || 0);
              if (value > 0) {
                addValue(rowId, incident.locality, value);
              }
            });
          }
          const destroyed = incident.destroyedItems as Record<string, number> | null | undefined;
          if (destroyed) {
            const techniquesValue = Number(destroyed.techniques || 0);
            if (techniquesValue > 0) {
              addValue("7", incident.locality, techniquesValue);
            }
            const structuresValue = Number(destroyed.structures || 0);
            if (structuresValue > 0) {
              addValue("8", incident.locality, structuresValue);
            }
          }
        });

        const socialStatusMap = FORM_5_SOCIAL_STATUS_TO_ROW;
        const conditionMap = FORM_5_CONDITION_TO_ROW;
        const deathCauseMap = FORM_5_DEATH_CAUSE_TO_ROW;
        const deathPlaceMap = FORM_5_DEATH_PLACE_TO_ROW;

        victimRows.forEach((victim) => {
          if (victim.victimType !== "fire" || victim.status !== "dead") {
            return;
          }
          const locality = incidentLocality.get(victim.incidentId);
          if (!locality) {
            return;
          }
          if (victim.gender === "male") {
            addValue("2.1", locality, 1);
          }
          if (victim.gender === "female") {
            addValue("2.2", locality, 1);
          }
          if (victim.ageGroup === "child") {
            addValue("2.3", locality, 1);
          }
          const socialStatus = normalizeIncidentVictimValue("socialStatus", victim.socialStatus);
          const condition = normalizeIncidentVictimValue("condition", victim.condition);
          const deathCause = normalizeIncidentVictimValue("deathCause", victim.deathCause);

          if (socialStatus && socialStatusMap[socialStatus]) {
            addValue(socialStatusMap[socialStatus], locality, 1);
          }
          if (condition && conditionMap[condition]) {
            addValue(conditionMap[condition], locality, 1);
          }
          if (deathCause && deathCauseMap[deathCause]) {
            addValue(deathCauseMap[deathCause], locality, 1);
          }
          if (victim.deathPlace && deathPlaceMap[victim.deathPlace]) {
            addValue(deathPlaceMap[victim.deathPlace], locality, 1);
          }
        });

        victimRows.forEach((victim) => {
          if (victim.victimType !== "fire" || victim.status !== "injured") {
            return;
          }
          const locality = incidentLocality.get(victim.incidentId);
          if (!locality) {
            return;
          }
          if (victim.gender === "male") {
            addValue("3.1", locality, 1);
          }
          if (victim.gender === "female") {
            addValue("3.2", locality, 1);
          }
        });

        const causeCounts = new Map<string, { urban: number; rural: number }>();
        residentialIncidents.forEach((incident) => {
          const code = incident.causeDetailed || incident.causeCode;
          if (!code) {
            return;
          }
          const existing = causeCounts.get(code) ?? { urban: 0, rural: 0 };
          if (this.normalizeLocalityValue(incident.locality) === "cities") {
            existing.urban += 1;
          } else if (this.normalizeLocalityValue(incident.locality) === "rural") {
            existing.rural += 1;
          }
          causeCounts.set(code, existing);
        });

        FORM_5_ROWS.forEach((row) => {
          if (row.isSection || !row.id.startsWith("6")) {
            return;
          }
          const mapped = causeCounts.get(row.id);
          if (mapped) {
            values[row.id] = mapped;
          }
        });

        const attachValues = (rows: typeof FORM_5_ROWS) =>
          rows.map((row) => ({
            ...row,
            values: row.isSection ? undefined : values[row.id] ?? { urban: 0, rural: 0 },
            children: row.children ? attachValues(row.children) : undefined,
          }));

        return {
          form: params.form,
          period: params.period,
          rows: attachValues(FORM_5_ROWS),
        };
      }
      case "6-sspz": {
        const steppeIncidents = incidentRows.filter((incident) => incident.incidentType === "steppe_fire");
        const ignitionIncidents = incidentRows.filter((incident) => incident.incidentType === "steppe_smolder");

        const buildRowValues = (rows: typeof FORM_6_STEPPE_FIRES_ROWS, incidentsList: typeof incidentRows) => {
          const map = new Map<string, any>();

          const blank = () => ({
            fires_count: 0,
            steppe_area: 0,
            damage_total: 0,
            people_total: 0,
            people_dead: 0,
            people_injured: 0,
            animals_total: 0,
            animals_dead: 0,
            animals_injured: 0,
            extinguished_total: 0,
            extinguished_area: 0,
            extinguished_damage: 0,
            garrison_people: 0,
            garrison_units: 0,
            mchs_people: 0,
            mchs_units: 0,
          });

          const addIncident = (rowKey: string, incident: (typeof incidentRows)[number]) => {
            const existing = map.get(rowKey) ?? blank();
            const areaValue = Number(incident.steppeArea || 0);
            const damageValue = Number(incident.steppeDamage || 0);
            const peopleDead = Number(incident.steppePeopleDead || 0);
            const peopleInjured = Number(incident.steppePeopleInjured || 0);
            const peopleTotal = Number(incident.steppePeopleTotal || 0) || peopleDead + peopleInjured;
            const animalsDead = Number(incident.steppeAnimalsDead || 0);
            const animalsInjured = Number(incident.steppeAnimalsInjured || 0);
            const animalsTotal = Number(incident.steppeAnimalsTotal || 0) || animalsDead + animalsInjured;
            const extinguishedTotal = Number(incident.steppeExtinguishedTotal || 0);
            const extinguishedArea = Number(incident.steppeExtinguishedArea || 0);
            const extinguishedDamage = Number(incident.steppeExtinguishedDamage || 0);
            const garrisonPeople = Number(incident.steppeGarrisonPeople || 0);
            const garrisonUnits = Number(incident.steppeGarrisonUnits || 0);
            const mchsPeople = Number(incident.steppeMchsPeople || 0);
            const mchsUnits = Number(incident.steppeMchsUnits || 0);
            existing.fires_count += 1;
            existing.steppe_area += areaValue;
            existing.damage_total += damageValue;
            existing.people_dead += peopleDead;
            existing.people_injured += peopleInjured;
            existing.people_total += peopleTotal;
            existing.animals_dead += animalsDead;
            existing.animals_injured += animalsInjured;
            existing.animals_total += animalsTotal;
            existing.extinguished_total += extinguishedTotal;
            existing.extinguished_area += extinguishedArea;
            existing.extinguished_damage += extinguishedDamage;
            existing.garrison_people += garrisonPeople;
            existing.garrison_units += garrisonUnits;
            existing.mchs_people += mchsPeople;
            existing.mchs_units += mchsUnits;
            map.set(rowKey, existing);
          };

          incidentsList.forEach((incident) => {
            const regionLabel = incident.region ?? "";
            if (regionLabel) {
              addIncident(regionLabel, incident);
            }
            addIncident("РК", incident);
          });

          return rows.map((row) => ({
            ...row,
            values: map.get(row.label) ?? blank(),
          }));
        };

        return {
          form: params.form,
          period: params.period,
          steppeRows: buildRowValues(FORM_6_STEPPE_FIRES_ROWS, steppeIncidents),
          ignitionRows: buildRowValues(FORM_6_IGNITIONS_ROWS, ignitionIncidents),
        };
      }
      case "co": {
        const values: Record<string, { killed_total: number; injured_total: number }> = {};
        const ensure = (rowId: string) => {
          if (!values[rowId]) {
            values[rowId] = { killed_total: 0, injured_total: 0 };
          }
          return values[rowId];
        };
        const socialStatusMap = FORM_7_DEAD_SOCIAL_STATUS_TO_ROW;
        const injuredSocialStatusMap = FORM_7_INJURED_SOCIAL_STATUS_TO_ROW;
        const conditionMap = FORM_7_DEAD_CONDITION_TO_ROW;
        const injuredConditionMap = FORM_7_INJURED_CONDITION_TO_ROW;

        const incidentMap = new Map(incidentRows.map(i => [i.id, i]));

        victimRows.forEach((victim) => {
          if (victim.victimType !== "co_poisoning") {
            return;
          }
          const incident = incidentMap.get(victim.incidentId);
          if (!incident) return;

          const objectRows = mapCoObjectCodeToForm7Rows(incident.objectCode, (message, meta) => {
            console.warn(message, {
              ...meta,
              incidentId: incident.id,
              victimId: victim.id,
            });
          });

          const timeBucket = resolveTimeOfDayBucket({
            dateTime: incident.dateTime,
            timeOfDay: incident.timeOfDay,
          });
          const timeRowId =
            timeBucket === "00:00-06:00"
              ? "8.1"
              : timeBucket === "06:00-12:00"
                ? "8.2"
                : timeBucket === "12:00-18:00"
                  ? "8.3"
                  : timeBucket === "18:00-24:00"
                    ? "8.4"
                    : null;

          // Helper for Weekday (Section 7)
          const mapWeekday = (date: Date) => {
             // 0=Sun, 1=Mon...
             const d = date.getDay();
             if (d === 1) return '7.1';
             if (d === 2) return '7.2';
             if (d === 3) return '7.3';
             if (d === 4) return '7.4';
             if (d === 5) return '7.5';
             if (d === 6) return '7.6';
             return '7.7'; // Sunday
          };
          const weekRowId = incident.dateTime ? mapWeekday(new Date(incident.dateTime)) : null;


          if (victim.status === "dead") {
            ensure("1").killed_total += 1;
            if (victim.gender === "male") ensure("1.1").killed_total += 1;
            if (victim.gender === "female") ensure("1.2").killed_total += 1;
            if (victim.ageGroup === "child") ensure("1.3").killed_total += 1;

            const socialStatus = normalizeIncidentVictimValue("socialStatus", victim.socialStatus);
            const condition = normalizeIncidentVictimValue("condition", victim.condition);

            if (socialStatus && socialStatusMap[socialStatus]) {
              ensure(socialStatusMap[socialStatus]).killed_total += 1;
            }
            if (condition && conditionMap[condition]) {
              ensure(conditionMap[condition]).killed_total += 1;
            }

            // Fill Object (5)
            ensure(objectRows.deadRowId).killed_total += 1;
            // Fill Time (8)
            if (timeRowId) ensure(timeRowId).killed_total += 1;
            // Fill Weekday (7)
            if (weekRowId) ensure(weekRowId).killed_total += 1;
          }

          if (victim.status === "injured") {
            ensure("11").injured_total += 1;
            if (victim.gender === "male") ensure("11.1").injured_total += 1;
            if (victim.gender === "female") ensure("11.2").injured_total += 1;
            if (victim.ageGroup === "child") ensure("11.3").injured_total += 1;

            const socialStatus = normalizeIncidentVictimValue("socialStatus", victim.socialStatus);
            const condition = normalizeIncidentVictimValue("condition", victim.condition);

            if (socialStatus && injuredSocialStatusMap[socialStatus]) {
              ensure(injuredSocialStatusMap[socialStatus]).injured_total += 1;
            }
            if (condition && injuredConditionMap[condition]) {
              ensure(injuredConditionMap[condition]).injured_total += 1;
            }

            ensure(objectRows.injuredRowId).injured_total += 1;

            // Fill Time (18)
            if (timeRowId) {
                const suffix = timeRowId.split('.')[1];
                ensure(`18.${suffix}`).injured_total += 1;
            }
            // Fill Weekday (17)
            if (weekRowId) {
                const suffix = weekRowId.split('.')[1];
                ensure(`17.${suffix}`).injured_total += 1;
            }
          }
        });

        const attachValues = (rows: typeof FORM_7_CO_ROWS) =>
          rows.map((row) => ({
            ...row,
            values: values[row.id] ?? { killed_total: 0, injured_total: 0 },
            children: row.children ? attachValues(row.children) : undefined,
          }));

        return {
          form: params.form,
          period: params.period,
          rows: attachValues(FORM_7_CO_ROWS),
        };
      }
      default:
        return {
          form: params.form,
          period: params.period,
          rows: [],
        };
    }
  }

  // Данные для отчетов (Excel)
  async getReportData(params: {
    orgId: string;
    period?: string;
    form?: string;
    includeChildren?: boolean;
    scopeUser?: ScopeUser;
  }): Promise<any> {
    await this.ensureIncidentSchemaChecked();
    const baseConditions = [];
    const ospIncidentTypes = ['fire', 'steppe_fire'] as const;
    const steppeTypes = ['steppe_fire', 'steppe_smolder'] as const;

    if (params.includeChildren) {
      const hierarchy = await orgStorage.getOrganizationHierarchy(params.orgId);
      const orgIds = hierarchy.map(o => o.id);
      baseConditions.push(inArray(incidents.orgUnitId, orgIds));
    } else {
      baseConditions.push(eq(incidents.orgUnitId, params.orgId));
    }

    if (params.period) {
      const [year, month] = params.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      baseConditions.push(gte(incidents.dateTime, startDate));
      baseConditions.push(lte(incidents.dateTime, endDate));
    }

    if (params.scopeUser) {
      const scopeCondition = applyScopeCondition(params.scopeUser, incidents.region, incidents.city);
      if (scopeCondition) {
        baseConditions.push(scopeCondition);
      }
    }

    const ospConditions = [...baseConditions];
    if (params.form === '1-osp') {
      ospConditions.push(inArray(incidents.incidentType, ospIncidentTypes));
    }

    const query = db
      .select({
        totalIncidents: sql<number>`count(*)`,
        cityIncidents: sql<number>`count(*) filter (where locality in ('cities', 'city_pgt'))`,
        ruralIncidents: sql<number>`count(*) filter (where locality = 'rural')`,
        totalDeaths: sql<number>`sum(deaths_total)`,
        cityDeaths: sql<number>`sum(deaths_total) filter (where locality in ('cities', 'city_pgt'))`,
        ruralDeaths: sql<number>`sum(deaths_total) filter (where locality = 'rural')`,
        childDeaths: sql<number>`sum(deaths_children)`,
        totalInjured: sql<number>`sum(injured_total)`,
        totalDamage: sql<number>`sum(damage)`,
        cityDamage: sql<number>`sum(damage) filter (where locality in ('cities', 'city_pgt'))`,
        ruralDamage: sql<number>`sum(damage) filter (where locality = 'rural')`,
      })
      .from(incidents)
      .where(and(...ospConditions));

    const [result] = await query;

    const steppeBase = [...baseConditions, inArray(incidents.incidentType, steppeTypes)];
    const [steppeTotals] = await db
      .select({
        firesCount: sql<number>`count(*)`,
        areaTotal: sql<number>`sum(steppe_area)`,
        damageTotal: sql<number>`sum(steppe_damage)`,
        peopleTotal: sql<number>`sum(steppe_people_total)`,
        peopleDead: sql<number>`sum(steppe_people_dead)`,
        peopleInjured: sql<number>`sum(steppe_people_injured)`,
        animalsTotal: sql<number>`sum(steppe_animals_total)`,
        animalsDead: sql<number>`sum(steppe_animals_dead)`,
        animalsInjured: sql<number>`sum(steppe_animals_injured)`,
        extinguishedTotal: sql<number>`sum(steppe_extinguished_total)`,
        extinguishedArea: sql<number>`sum(steppe_extinguished_area)`,
        extinguishedDamage: sql<number>`sum(steppe_extinguished_damage)`,
        garrisonPeople: sql<number>`sum(steppe_garrison_people)`,
        garrisonUnits: sql<number>`sum(steppe_garrison_units)`,
        mchsPeople: sql<number>`sum(steppe_mchs_people)`,
        mchsUnits: sql<number>`sum(steppe_mchs_units)`,
      })
      .from(incidents)
      .where(and(...steppeBase, eq(incidents.incidentType, "steppe_fire")));

    const [ignitionTotals] = await db
      .select({
        firesCount: sql<number>`count(*)`,
        areaTotal: sql<number>`sum(steppe_area)`,
        damageTotal: sql<number>`sum(steppe_damage)`,
        peopleTotal: sql<number>`sum(steppe_people_total)`,
        peopleDead: sql<number>`sum(steppe_people_dead)`,
        peopleInjured: sql<number>`sum(steppe_people_injured)`,
        animalsTotal: sql<number>`sum(steppe_animals_total)`,
        animalsDead: sql<number>`sum(steppe_animals_dead)`,
        animalsInjured: sql<number>`sum(steppe_animals_injured)`,
        extinguishedTotal: sql<number>`sum(steppe_extinguished_total)`,
        extinguishedArea: sql<number>`sum(steppe_extinguished_area)`,
        extinguishedDamage: sql<number>`sum(steppe_extinguished_damage)`,
        garrisonPeople: sql<number>`sum(steppe_garrison_people)`,
        garrisonUnits: sql<number>`sum(steppe_garrison_units)`,
        mchsPeople: sql<number>`sum(steppe_mchs_people)`,
        mchsUnits: sql<number>`sum(steppe_mchs_units)`,
      })
      .from(incidents)
      .where(and(...steppeBase, eq(incidents.incidentType, "steppe_smolder")));

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
      },
      sspz: {
        totalFires: Number(steppeTotals?.firesCount) || 0,
        totalArea: Number(steppeTotals?.areaTotal) || 0,
        totalDamage: Number(steppeTotals?.damageTotal) || 0,
        peopleTotal: Number(steppeTotals?.peopleTotal) || 0,
        peopleDead: Number(steppeTotals?.peopleDead) || 0,
        peopleInjured: Number(steppeTotals?.peopleInjured) || 0,
        animalsTotal: Number(steppeTotals?.animalsTotal) || 0,
        animalsDead: Number(steppeTotals?.animalsDead) || 0,
        animalsInjured: Number(steppeTotals?.animalsInjured) || 0,
        extinguishedTotal: Number(steppeTotals?.extinguishedTotal) || 0,
        extinguishedArea: Number(steppeTotals?.extinguishedArea) || 0,
        extinguishedDamage: Number(steppeTotals?.extinguishedDamage) || 0,
        garrisonPeople: Number(steppeTotals?.garrisonPeople) || 0,
        garrisonUnits: Number(steppeTotals?.garrisonUnits) || 0,
        mchsPeople: Number(steppeTotals?.mchsPeople) || 0,
        mchsUnits: Number(steppeTotals?.mchsUnits) || 0,
        totalIgnitions: Number(ignitionTotals?.firesCount) || 0,
        ignitionArea: Number(ignitionTotals?.areaTotal) || 0,
        ignitionDamage: Number(ignitionTotals?.damageTotal) || 0,
        ignitionPeopleTotal: Number(ignitionTotals?.peopleTotal) || 0,
        ignitionPeopleDead: Number(ignitionTotals?.peopleDead) || 0,
        ignitionPeopleInjured: Number(ignitionTotals?.peopleInjured) || 0,
        ignitionAnimalsTotal: Number(ignitionTotals?.animalsTotal) || 0,
        ignitionAnimalsDead: Number(ignitionTotals?.animalsDead) || 0,
        ignitionAnimalsInjured: Number(ignitionTotals?.animalsInjured) || 0,
        ignitionExtinguishedTotal: Number(ignitionTotals?.extinguishedTotal) || 0,
        ignitionExtinguishedArea: Number(ignitionTotals?.extinguishedArea) || 0,
        ignitionExtinguishedDamage: Number(ignitionTotals?.extinguishedDamage) || 0,
        ignitionGarrisonPeople: Number(ignitionTotals?.garrisonPeople) || 0,
        ignitionGarrisonUnits: Number(ignitionTotals?.garrisonUnits) || 0,
        ignitionMchsPeople: Number(ignitionTotals?.mchsPeople) || 0,
        ignitionMchsUnits: Number(ignitionTotals?.mchsUnits) || 0,
      },
    };
  }
}
