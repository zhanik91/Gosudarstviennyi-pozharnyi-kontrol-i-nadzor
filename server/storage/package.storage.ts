import { db } from "./db";
import { packages, type Package, type InsertPackage } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { applyScopeCondition } from "../services/authz";

export class PackageStorage {
  async getPackages(filters?: {
    orgUnitId?: string;
    status?: string;
    period?: string;
    scopeUser?: {
      role: "MCHS" | "DCHS" | "DISTRICT";
      orgUnitId?: string | null;
    };
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

    if (filters?.scopeUser) {
      const scopeCondition = await applyScopeCondition(filters.scopeUser, packages.orgUnitId);
      if (scopeCondition) {
        conditions.push(scopeCondition);
      }
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

  // Stub for reports validation
  async validateReports(orgId: string, period?: string): Promise<any[]> {
    return [
      {
        form: '1-ОСП',
        section: 'Валидация',
        description: 'Пример ошибки валидации',
        severity: 'warning'
      }
    ];
  }
}
