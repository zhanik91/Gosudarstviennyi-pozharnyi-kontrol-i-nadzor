import {
  users,
  organizations,
  incidents,
  packages,
  auditLogs,
  type User,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Incident,
  type InsertIncident,
  type Package,
  type InsertPackage,
  type AuditLog,
  type InsertAuditLog,
  documents,
  insertAuditLogSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";
import { z } from "zod";

export interface IStorage {
  // User operations for local authentication
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganizationHierarchy(orgId: string): Promise<Organization[]>;
  
  // Incident operations
  getIncidents(filters?: {
    organizationId?: string;
    period?: string;
    includeSubOrgs?: boolean;
  }): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, incident: Partial<InsertIncident>): Promise<Incident>;
  deleteIncident(id: string): Promise<void>;
  
  // Package operations
  getPackages(filters?: {
    organizationId?: string;
    status?: string;
    period?: string;
  }): Promise<Package[]>;
  getPackage(id: string): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package>;
  
  // Audit operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuditLog[]>;
  
  // Statistics
  getIncidentStats(organizationId: string, period?: string): Promise<{
    totalIncidents: number;
    totalDeaths: number;
    totalInjured: number;
    totalDamage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Organization operations
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
    // Get organization and all its children recursively
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

  // Incident operations
  async getIncidents(filters?: {
    organizationId?: string;
    period?: string;
    includeSubOrgs?: boolean;
  }): Promise<Incident[]> {
    let query = db.select().from(incidents);
    const conditions = [];
    
    if (filters?.organizationId) {
      if (filters.includeSubOrgs) {
        const orgIds = (await this.getOrganizationHierarchy(filters.organizationId)).map(o => o.id);
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
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(incidents.dateTime)) as Incident[];
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async createIncident(incidentData: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(incidents).values(incidentData).returning();
    return incident;
  }

  async updateIncident(id: string, incidentData: Partial<InsertIncident>): Promise<Incident> {
    const [incident] = await db
      .update(incidents)
      .set({ ...incidentData, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    return incident;
  }

  async deleteIncident(id: string): Promise<void> {
    await db.delete(incidents).where(eq(incidents.id, id));
  }

  // Package operations
  async getPackages(filters?: {
    organizationId?: string;
    status?: string;
    period?: string;
  }): Promise<Package[]> {
    let query = db.select().from(packages);
    const conditions = [];
    
    if (filters?.organizationId) {
      conditions.push(eq(packages.organizationId, filters.organizationId));
    }
    
    if (filters?.status) {
      conditions.push(eq(packages.status, filters.status as any));
    }
    
    if (filters?.period) {
      conditions.push(eq(packages.period, filters.period));
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

  // Audit operations
  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData as any).returning();
    return log;
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    const conditions = [];
    
    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(auditLogs.createdAt, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(auditLogs.createdAt, filters.dateTo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(auditLogs.createdAt)) as AuditLog[];
  }

  // Statistics
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

  // Статистика дашборда
  async getIncidentsCount(): Promise<number> {
    const allIncidents = await db.select().from(incidents);
    return allIncidents.length;
  }

  async getObjectsCount(): Promise<number> {
    // Заглушка для подконтрольных объектов - в реальной системе это будет отдельная таблица
    return 2156;
  }

  async getReportsCount(): Promise<number> {
    // Подсчет пакетов отчетов
    const allPackages = await db.select().from(packages);
    return allPackages.length;
  }

  async getUsersCount(): Promise<number> {
    const allUsers = await db.select().from(users);
    return allUsers.length;
  }

  // Получение данных отчетов из реальной базы данных
  async getReportData(params: {
    orgId: string;
    period?: string;
    form?: string;
    includeChildren?: boolean;
  }): Promise<any> {
    const conditions = [];
    
    // Фильтр по организации
    if (params.includeChildren) {
      const orgIds = (await this.getOrganizationHierarchy(params.orgId)).map(o => o.id);
      conditions.push(inArray(incidents.organizationId, orgIds));
    } else {
      conditions.push(eq(incidents.organizationId, params.orgId));
    }
    
    // Фильтр по периоду
    if (params.period) {
      const [year, month] = params.period.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      conditions.push(gte(incidents.dateTime, startDate));
      conditions.push(lte(incidents.dateTime, endDate));
    }
    
    // Получаем реальные данные из базы
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

  // Валидация отчетов
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

  // Работа с пакетами
  async getApprovedPackages(orgId: string, period: string): Promise<any[]> {
    return [
      { id: 'pkg-001', orgId: 'child-org-1', period, status: 'approved', createdAt: new Date() }
    ];
  }

  async createConsolidatedPackage(data: any): Promise<any> {
    return { id: 'consolidated-' + Date.now(), ...data, createdAt: new Date() };
  }

  // updatePackage is already defined above

  // CRM Методы управления организациями
  // createOrganization is already defined above

  async getOrganizationDetails(id: string): Promise<any> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    if (!org) return null;

    // Получаем статистику по организации
    const stats = await this.getOrganizationStats(id);
    return { ...org, stats };
  }

  async getOrganizationStats(orgId: string): Promise<any> {
    const incidentsCount = await db.select({ count: sql<number>`count(*)` })
      .from(incidents)
      .where(eq(incidents.organizationId, orgId));
    
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

  // Методы документооборота
  async createDocument(documentData: any): Promise<any> {
    const [document] = await db.insert(documents).values(documentData).returning();
    return document;
  }

  async getDocuments(filters: any = {}): Promise<any[]> {
    let query = db.select().from(documents);
    const conditions = [];
    
    if (filters.organizationId) conditions.push(eq(documents.organizationId, filters.organizationId));
    if (filters.documentType) conditions.push(eq(documents.documentType, filters.documentType));
    if (filters.status) conditions.push(eq(documents.status, filters.status));
    if (filters.period) conditions.push(eq(documents.period, filters.period));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(documents.createdAt)) as any[];
  }

  async updateDocumentStatus(id: string, status: string): Promise<any> {
    const [document] = await db
      .update(documents)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async getDocumentById(id: string): Promise<any> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  // Система уведомлений
  async createNotification(data: any): Promise<any> {
    const notificationData = {
      id: `notif-${Date.now()}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      isRead: false,
      createdAt: new Date(),
      ...data
    };
    
    // В реальной системе здесь будет вставка в БД
    return notificationData;
  }

  async getUserNotifications(userId: string): Promise<any[]> {
    // Временная заглушка - в реальной системе запрос к БД
    return [
      {
        id: 'notif-1',
        title: 'Новое происшествие',
        message: 'Зарегистрирован пожар в вашем районе',
        type: 'warning',
        isRead: false,
        createdAt: new Date()
      }
    ];
  }

  // Расширенная аналитика
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

  // Система поиска
  async searchIncidents(query: string, filters: any = {}): Promise<any[]> {
    const conditions = [];
    
    // Поиск по адресу, описанию
    if (query) {
      conditions.push(
        or(
          ilike(incidents.address, `%${query}%`),
          ilike(incidents.description, `%${query}%`)
        )
      );
    }
    
    if (filters.region) conditions.push(eq(incidents.region, filters.region));
    if (filters.incidentType) conditions.push(eq(incidents.incidentType, filters.incidentType));
    if (filters.dateFrom) conditions.push(gte(incidents.dateTime, new Date(filters.dateFrom)));
    if (filters.dateTo) conditions.push(lte(incidents.dateTime, new Date(filters.dateTo)));

    let searchQuery = db.select().from(incidents);
    
    if (conditions.length > 0) {
      searchQuery = searchQuery.where(and(...conditions));
    }
    
    return await searchQuery.orderBy(desc(incidents.dateTime)).limit(100) as any[];
  }

  // Методы для получения всех пользователей и активности для CRM
  // getAllUsers is already defined above

  async getAllOrganizations(): Promise<any[]> {
    return await db.select().from(organizations).orderBy(organizations.name);
  }

  async getRecentActivities(limit: number = 10): Promise<any[]> {
    // Временная заглушка с примерами активности
    return [
      { user: 'Администратор МЧС Алматы', action: 'создал новое происшествие', timestamp: '2 минуты назад', type: 'info' },
      { user: 'Инспектор Шымкент', action: 'утвердил отчет 1-ОСП', timestamp: '15 минут назад', type: 'success' },
      { user: 'Старший специалист Астана', action: 'внес изменения в документ', timestamp: '1 час назад', type: 'warning' }
    ].slice(0, limit);
  }
}

export const storage = new DatabaseStorage();

(storage as any).getDocument = async function(id: string) {
  const [document] = await db.select().from(documents).where(eq(documents.id, id));
  return document;
};

(storage as any).updateDocument = async function(id: string, updates: any) {
  const [document] = await db
    .update(documents)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(documents.id, id))
    .returning();
  return document;
};

(storage as any).deleteDocument = async function(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
  return true;
};
