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
 * Проверяет, является ли пользователь администратором МЧС (полный доступ)
 */
export function isAdmin(user: ScopeUser | any): boolean {
  if (!user) return false;
  const role = user.role?.toUpperCase?.() ?? user.role?.toUpperCase?.();
  return role === 'ADMIN' || role === 'MCHS';
}

/**
 * Проверяет, является ли пользователь ДЧС (областной уровень)
 */
export function isDCHS(user: ScopeUser | any): boolean {
  if (!user) return false;
  const role = user.role?.toUpperCase?.() ?? user.role?.toUpperCase?.();
  return role === 'DCHS';
}

/**
 * Проверяет, является ли пользователь ОЧС (районный уровень)
 * Поддерживает роли OCHS и DISTRICT (используется на фронтенде)
 */
export function isOCHS(user: ScopeUser | any): boolean {
  if (!user) return false;
  const role = user.role?.toUpperCase?.() ?? user.role?.toUpperCase?.();
  return role === 'OCHS' || role === 'DISTRICT';
}

/**
 * Возвращает уровень доступа пользователя
 */
export function getUserLevel(user: ScopeUser | any): 'MCHS' | 'DCHS' | 'OCHS' {
  if (isAdmin(user)) return 'MCHS';
  if (isDCHS(user)) return 'DCHS';
  if (isOCHS(user)) return 'OCHS';
  return 'OCHS';
}

/**
 * Проверяет, может ли пользователь редактировать данные (admin, DCHS, OCHS - да, MCHS - нет)
 */
export function canEdit(user: ScopeUser | any): boolean {
  if (!user) return false;
  const role = user.role?.toUpperCase?.() ?? user.role?.toUpperCase?.();
  // MCHS - только чтение, остальные могут редактировать
  return role !== 'MCHS';
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

  // Администратор или МЧС (только чтение, но всё видит) - видит всё
  if (isAdmin(user)) {
    return undefined;
  }

  // ДЧС - фильтр по области (видит все районы своей области)
  if (isDCHS(user)) {
    if (!user.region) {
      // DCHS без региона - блокируем доступ (ошибка в данных)
      console.warn(`DCHS user ${user.id} has no region assigned`);
      return sql`1 = 0`;
    }
    return eq(regionColumn, user.region);
  }

  // ОЧС/DISTRICT - фильтр по области И району
  if (isOCHS(user)) {
    if (!user.region) {
      // OCHS без региона - блокируем доступ (ошибка в данных)
      console.warn(`OCHS user ${user.id} has no region assigned`);
      return sql`1 = 0`;
    }
    
    // Если есть колонка района и у пользователя задан район - фильтруем по обоим
    if (user.district && districtColumn) {
      return and(
        eq(regionColumn, user.region),
        eq(districtColumn, user.district)
      );
    }
    
    // Если нет колонки района или у OCHS не задан район - фильтр только по региону
    return eq(regionColumn, user.region);
  }

  // Fallback - нет доступа
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

  if (conditions.length === 1) {
    return query.where(conditions[0]);
  }

  const combined = and(...conditions);
  if (!combined) {
    return query;
  }
  return query.where(combined);
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
  canEdit,
  applyScopeCondition,
  applyScope,
  scopeMiddleware
};
