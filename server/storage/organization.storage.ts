import { db } from "./db";
import { organizations, type Organization, type InsertOrganization, incidents } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export class OrganizationStorage {
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.isActive, true));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async createOrganization(orgData: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(orgData).returning();
    return org;
  }

  async getOrganizationHierarchy(orgId: string): Promise<Organization[]> {
    const result = await db.execute(sql`
      WITH RECURSIVE org_tree AS (
        SELECT * FROM ${organizations} WHERE id = ${orgId}
        UNION ALL
        SELECT o.* FROM ${organizations} o
        INNER JOIN org_tree ot ON o.parent_id = ot.id
      )
      SELECT * FROM org_tree WHERE is_active = true
    `);
    return result.rows as Organization[];
  }

  async getAllOrganizations(): Promise<any[]> {
    return await db.select().from(organizations).orderBy(organizations.name);
  }

  async getOrganizationDetails(id: string): Promise<any> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    if (!org) return null;

    const stats = await this.getOrganizationStats(id);
    return { ...org, stats };
  }

  async getOrganizationStats(orgId: string): Promise<any> {
    const incidentsCount = await db.select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(eq(incidents.organizationId, orgId));

    // Note: getOrganizationStats previously fetched recent incidents too,
    // but that creates a circular dependency or requires importing incidents here.
    // Kept minimal for now to avoid circular deps if possible, or we can use the table reference.
    // Since we imported 'incidents', we can do it.

    const recentIncidents = await db.select()
      .from(incidents)
      .where(eq(incidents.organizationId, orgId))
      .orderBy(desc(incidents.dateTime))
      .limit(5);

    return {
      totalIncidents: incidentsCount[0]?.count || 0,
      recentIncidents
    };
  }
}

import { desc } from "drizzle-orm";
