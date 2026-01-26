import { db } from "./db";
import { orgUnits, type OrgUnit, type InsertOrgUnit, incidents } from "@shared/schema";
import { and, eq, sql } from "drizzle-orm";
import { applyScopeCondition, type ScopeUser } from "../services/authz";

export class OrganizationStorage {
  async getOrganizations(scopeUser?: ScopeUser): Promise<OrgUnit[]> {
    const conditions = [eq(orgUnits.isActive, true)];
    if (scopeUser) {
      const scopeCondition = applyScopeCondition(scopeUser, orgUnits.regionName, orgUnits.unitName);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
    }
    return await db.select().from(orgUnits).where(and(...conditions));
  }

  async getOrganization(id: string): Promise<OrgUnit | undefined> {
    const [org] = await db.select().from(orgUnits).where(eq(orgUnits.id, id));
    return org;
  }

  async createOrganization(orgData: InsertOrgUnit): Promise<OrgUnit> {
    const [org] = await db.insert(orgUnits).values(orgData).returning();
    return org;
  }

  async getOrganizationHierarchy(orgId: string): Promise<OrgUnit[]> {
    const result = await db.execute(sql`
      WITH RECURSIVE org_tree AS (
        SELECT * FROM ${orgUnits} WHERE id = ${orgId}
        UNION ALL
        SELECT o.* FROM ${orgUnits} o
        INNER JOIN org_tree ot ON o.parent_id = ot.id
      )
      SELECT * FROM org_tree WHERE is_active = true
    `);
    return result.rows as OrgUnit[];
  }

  async getAllOrganizations(): Promise<any[]> {
    return await db.select().from(orgUnits).orderBy(orgUnits.name);
  }

  async getOrganizationDetails(id: string): Promise<any> {
    const [org] = await db.select().from(orgUnits).where(eq(orgUnits.id, id));
    if (!org) return null;

    const stats = await this.getOrganizationStats(id);
    return { ...org, stats };
  }

  async getOrganizationStats(orgId: string): Promise<any> {
    const incidentsCount = await db.select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(eq(incidents.orgUnitId, orgId));

    // Note: getOrganizationStats previously fetched recent incidents too,
    // but that creates a circular dependency or requires importing incidents here.
    // Kept minimal for now to avoid circular deps if possible, or we can use the table reference.
    // Since we imported 'incidents', we can do it.

    const recentIncidents = await db.select()
      .from(incidents)
      .where(eq(incidents.orgUnitId, orgId))
      .orderBy(desc(incidents.dateTime))
      .limit(5);

    return {
      totalIncidents: incidentsCount[0]?.count || 0,
      recentIncidents
    };
  }
}

import { desc } from "drizzle-orm";
