// Сервис авторизации и контроля организационной области

interface Organization {
  id: string;
  parentId?: string;
  name: string;
  level: 'republic' | 'region' | 'district';
}

interface User {
  id: string;
  orgId: string;
  role: 'editor' | 'reviewer' | 'approver' | 'admin';
}

/**
 * Строит набор ID организаций, доступных пользователю для просмотра
 * (включая дочерние организации)
 */
export function buildOrgSet(orgs: Organization[], rootId: string): Set<string> {
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
export function assertOrgScope(orgs: Organization[], userOrgId: string, requestedOrgId: string): void {
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
  const canAccessTree = ['reviewer', 'approver', 'admin'].includes(userRole);
  
  if (!canAccessTree) {
    const error = new Error('Access forbidden: insufficient role for hierarchical data');
    (error as any).code = 403;
    throw error;
  }
}

/**
 * Middleware для проверки организационной области
 */
export function orgScopeMiddleware(orgs: Organization[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, msg: 'unauthorized' });
    }

    const orgId = req.query.orgId || req.body.orgId || req.user.orgId;
    const includeChildren = req.query.includeChildren === 'true';

    try {
      // Проверка доступа к организации
      assertOrgScope(orgs, req.user.orgId, orgId);
      
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

export default {
  buildOrgSet,
  assertOrgScope,
  assertTreeAccess,
  orgScopeMiddleware
};