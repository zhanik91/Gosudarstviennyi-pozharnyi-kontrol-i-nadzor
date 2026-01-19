// Сервис авторизации и контроля доступа по региону/району
import { and, eq, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

export type ScopeUser = {
  id: string;
  role: string;
  region?: string | null;
  district?: string | null;
};

/**
 * Преобразует пользователя в объект для фильтрации по области/району
 */
export function toScopeUser(user: any): ScopeUser | undefined {
  if (!user) return undefined;
  return {
    id: user.id ?? user.username ?? "",
    role: user.role ?? "editor",
    region: user.region ?? null,
    district: user.district ?? null,
  };
}

/**
 * Проверяет, является ли пользователь администратором МЧС
 */
export function isAdmin(user: ScopeUser | any): boolean {
  if (!user) return false;
  const role = user.role?.toLowerCase?.() ?? user.role;
  return role === 'admin' || role === 'mchs';
}

/**
 * Проверяет, является ли пользователь ДЧС (областной уровень)
 */
export function isDCHS(user: ScopeUser | any): boolean {
  if (!user) return false;
  // ДЧС - это пользователь с регионом, но без района
  return user.region && !user.district;
}

/**
 * Проверяет, является ли пользователь ОЧС (районный уровень)
 */
export function isOCHS(user: ScopeUser | any): boolean {
  if (!user) return false;
  // ОЧС - это пользователь с регионом И районом
  return user.region && user.district;
}

/**
 * Возвращает уровень доступа пользователя
 */
export function getUserLevel(user: ScopeUser | any): 'MCHS' | 'DCHS' | 'OCHS' {
  if (isAdmin(user)) return 'MCHS';
  if (isDCHS(user)) return 'DCHS';
  return 'OCHS';
}

/**
 * Применяет фильтр по региону/району для запроса инцидентов
 * 
 * МЧС - видит всё
 * ДЧС - видит только свою область (все районы)
 * ОЧС - видит только свой район
 */
export function applyScopeCondition(
  user: ScopeUser | undefined,
  regionColumn: any,
  districtColumn?: any
): SQL | undefined {
  return applyScopeConditionInternal(user, regionColumn, districtColumn);
}

function applyScopeConditionInternal(
  user: ScopeUser | undefined,
  regionColumn: any,
  districtColumn?: any
): SQL | undefined {
  if (!user) {
    return sql`1 = 0`;
  }

  // Администратор МЧС видит всё
  if (isAdmin(user)) {
    return undefined;
  }

  // ДЧС - фильтр по области (видит все районы своей области)
  if (isDCHS(user) && user.region) {
    return eq(regionColumn, user.region);
  }

  // ОЧС - фильтр по области И району
  if (isOCHS(user) && user.region && user.district && districtColumn) {
    return and(
      eq(regionColumn, user.region),
      eq(districtColumn, user.district)
    );
  }

  // Если только регион указан
  if (user.region) {
    return eq(regionColumn, user.region);
  }

  // Нет доступа
  return sql`1 = 0`;
}

/**
 * Применяет фильтр области/района к запросу
 */
export async function applyScope<T extends { where: (condition: SQL) => T }>(
  query: T,
  user: ScopeUser,
  regionColumn: any,
  districtColumn?: any,
  extraConditions: SQL[] = [],
): Promise<T> {
  const scopeCondition = applyScopeCondition(user, regionColumn, districtColumn);
  const conditions = [...extraConditions];
  
  if (scopeCondition) {
    conditions.push(scopeCondition);
  }

  if (conditions.length === 0) {
    return query;
  }

  return query.where(and(...conditions));
}

/**
 * Middleware для проверки доступа к данным
 */
export function scopeMiddleware() {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, msg: 'unauthorized' });
    }

    req.scopeUser = toScopeUser(req.user);
    req.userLevel = getUserLevel(req.user);
    
    next();
  };
}

export default {
  toScopeUser,
  isAdmin,
  isDCHS,
  isOCHS,
  getUserLevel,
  applyScopeCondition,
  applyScope,
  scopeMiddleware
};
