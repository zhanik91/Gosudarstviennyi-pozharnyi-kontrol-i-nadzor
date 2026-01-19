// Сервис авторизации и контроля организационной области
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../storage/db";
import { orgUnits } from "@shared/schema";
import type { SQL } from "drizzle-orm";

interface OrgUnit {
  id: string;
  parentId?: string;
  name: string;
  type: 'MCHS' | 'DCHS' | 'DISTRICT';
}

interface UserScope {
  id: string;
  orgUnitId?: string | null;
  role: 'MCHS' | 'DCHS' | 'DISTRICT';
}

export function toScopeUser(user: any): UserScope | undefined {
  if (!user) return undefined;
  return {
    id: user.id ?? user.username ?? "",
    role: user.role,
    orgUnitId: user.orgUnitId ?? null,
  };
}

/**
 * Строит набор ID организаций, доступных пользователю для просмотра
 * (включая дочерние организации)
 */
export function buildOrgSet(orgs: OrgUnit[], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  const queue = [rootId];
  
  while (queue.length > 0) {
    const id = queue.pop()!;
    const children = orgs.filter(o => o.parentId === id);
    
    for (const child of children) {
      if (!ids.has(child.id)) {
        ids.add(child.id);
        queue.push(child.id);
      }
    }
  }
  
  return ids;
}

/**
 * Проверяет, имеет ли пользователь доступ к запрашиваемой организации
 */
export function assertOrgScope(orgs: OrgUnit[], userOrgId: string, requestedOrgId: string): void {
  const allowedOrgs = buildOrgSet(orgs, userOrgId);
  
  if (!allowedOrgs.has(requestedOrgId)) {
    const error = new Error('Access forbidden: organization out of scope');
    (error as any).code = 403;
    throw error;
  }
}

/**
 * Проверяет, может ли пользователь запрашивать данные с includeChildren=true
 */
export function assertTreeAccess(userRole: string): void {
  const canAccessTree = ['MCHS', 'DCHS'].includes(userRole);
  
  if (!canAccessTree) {
    const error = new Error('Access forbidden: insufficient role for hierarchical data');
    (error as any).code = 403;
    throw error;
  }
}

/**
 * Middleware для проверки организационной области
 */
export function orgScopeMiddleware(orgs: OrgUnit[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, msg: 'unauthorized' });
    }

    const orgId = req.query.orgId || req.body.orgId || req.user.orgUnitId;
    const includeChildren = req.query.includeChildren === 'true';

    try {
      // Проверка доступа к организации
      assertOrgScope(orgs, req.user.orgUnitId, orgId);
      
      // Проверка доступа к иерархическим данным
      if (includeChildren) {
        assertTreeAccess(req.user.role);
      }

      // Добавляем проверенный orgId в запрос
      req.validatedOrgId = orgId;
      req.includeChildren = includeChildren;
      
      next();
    } catch (error: any) {
      const status = error.code || 403;
      return res.status(status).json({ 
        ok: false, 
        msg: error.message || 'forbidden' 
      });
    }
  };
}

export async function applyScopeCondition(user: UserScope, orgUnitColumn: any): Promise<SQL | undefined> {
  if (!user) {
    return sql`1 = 0`;
  }

  if (user.role === 'MCHS') {
    return undefined;
  }

  if (!user.orgUnitId) {
    return sql`1 = 0`;
  }

  if (user.role === 'DISTRICT') {
    return eq(orgUnitColumn, user.orgUnitId);
  }

  const childUnitsQuery = db
    .select({ id: orgUnits.id })
    .from(orgUnits)
    .where(eq(orgUnits.parentId, user.orgUnitId));

  return or(
    eq(orgUnitColumn, user.orgUnitId),
    inArray(orgUnitColumn, childUnitsQuery),
  );
}

export async function applyScope<T extends { where: (condition: SQL) => T }>(
  query: T,
  user: UserScope,
  orgUnitColumn: any,
  extraConditions: SQL[] = [],
): Promise<T> {
  const scopeCondition = await applyScopeCondition(user, orgUnitColumn);
  const conditions = [...extraConditions];
  if (scopeCondition) {
    conditions.push(scopeCondition);
  }

  if (conditions.length === 0) {
    return query;
  }

  return query.where(and(...conditions));
}

export default {
  buildOrgSet,
  assertOrgScope,
  assertTreeAccess,
  orgScopeMiddleware
};
