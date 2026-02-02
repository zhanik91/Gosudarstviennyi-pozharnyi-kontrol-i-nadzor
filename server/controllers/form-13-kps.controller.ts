/**
 * Контроллер формы 13-КПС
 * Сведения о государственном контроле и надзоре в области пожарной безопасности
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { inspections, measures, organizationsRegistry, controlObjects } from '@shared/schema';
import { sql, and, eq, gte, lte, count, sum } from 'drizzle-orm';

// Интерфейсы для данных формы 13-КПС
interface Form13KPSInspections {
    total: number;
    byType: {
        scheduled: number;
        unscheduled: number;
        preventive_control: number;
        monitoring: number;
    };
    byBasis: {
        plan: number;
        prescription: number;
        prosecutor: number;
        complaint: number;
        pnsem: number;
        fire_incident: number;
        other: number;
    };
    byRiskLevel: {
        high: number;
        medium: number;
        low: number;
    };
    withViolations: number;
    withAdminResponsibility: number;
    followUp: number;
}

interface Form13KPSMeasures {
    total: number;
    primary: number;
    repeat: number;
    byStatus: {
        issued: number;
        in_progress: number;
        completed: number;
    };
}

interface Form13KPSOrganizations {
    total: number;
    byType: {
        government: number;
        small_business: number;
        medium_business: number;
        large_business: number;
        individual: number;
    };
}

interface Form13KPSData {
    period: string;
    region: string;
    district: string;
    inspections: Form13KPSInspections;
    measures: Form13KPSMeasures;
    organizations: Form13KPSOrganizations;
    generatedAt: string;
}

/**
 * Получить данные для формы 13-КПС
 * GET /api/reports/form-13-kps?period=2026-01&region=Алматы&district=
 */
export async function getForm13KPSReport(req: Request, res: Response) {
    try {
        const { period, region, district } = req.query;

        if (!period) {
            return res.status(400).json({ error: 'Параметр period обязателен (формат: YYYY-MM)' });
        }

        const periodStr = String(period);
        const [year, month] = periodStr.split('-').map(Number);

        if (!year || !month || month < 1 || month > 12) {
            return res.status(400).json({ error: 'Неверный формат периода. Используйте YYYY-MM' });
        }

        // Определяем диапазон дат для периода
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Базовые условия фильтрации
        const baseConditions = [
            gte(inspections.inspectionDate, startDate),
            lte(inspections.inspectionDate, endDate),
        ];

        if (region && region !== 'Все') {
            baseConditions.push(eq(inspections.region, String(region)));
        }

        if (district && district !== 'Все') {
            baseConditions.push(eq(inspections.district, String(district)));
        }

        // 1. Агрегация данных по проверкам
        const inspectionsData = await getInspectionsAggregation(baseConditions, startDate, endDate);

        // 2. Агрегация данных по мерам
        const measuresData = await getMeasuresAggregation(
            startDate,
            endDate,
            region ? String(region) : undefined,
            district ? String(district) : undefined
        );

        // 3. Агрегация данных по организациям
        const organizationsData = await getOrganizationsAggregation(
            region ? String(region) : undefined,
            district ? String(district) : undefined
        );

        const result: Form13KPSData = {
            period: periodStr,
            region: region ? String(region) : 'Все',
            district: district ? String(district) : 'Все',
            inspections: inspectionsData,
            measures: measuresData,
            organizations: organizationsData,
            generatedAt: new Date().toISOString(),
        };

        return res.json(result);
    } catch (error) {
        console.error('Error generating Form 13-KPS report:', error);
        return res.status(500).json({ error: 'Ошибка при формировании отчёта' });
    }
}

/**
 * Агрегация данных по проверкам
 */
async function getInspectionsAggregation(
    _baseConditions: any[],
    startDate: Date,
    endDate: Date
): Promise<Form13KPSInspections> {
    // Получаем все проверки за период
    const allInspections = await db
        .select()
        .from(inspections)
        .where(
            and(
                gte(inspections.inspectionDate, startDate),
                lte(inspections.inspectionDate, endDate)
            )
        );

    // Считаем по типам
    const byType = {
        scheduled: 0,
        unscheduled: 0,
        preventive_control: 0,
        monitoring: 0,
    };

    // Считаем по основаниям
    const byBasis = {
        plan: 0,
        prescription: 0,
        prosecutor: 0,
        complaint: 0,
        pnsem: 0,
        fire_incident: 0,
        other: 0,
    };

    // Считаем по степени риска
    const byRiskLevel = {
        high: 0,
        medium: 0,
        low: 0,
    };

    let withViolations = 0;
    let withAdminResponsibility = 0;
    let followUp = 0;

    for (const insp of allInspections) {
        // По типу
        if (insp.type === 'scheduled') byType.scheduled++;
        else if (insp.type === 'unscheduled') byType.unscheduled++;
        else if (insp.type === 'preventive_control') byType.preventive_control++;
        else if (insp.type === 'monitoring') byType.monitoring++;

        // По основанию
        const basis = insp.inspectionBasis || 'plan';
        if (basis in byBasis) {
            byBasis[basis as keyof typeof byBasis]++;
        }

        // По степени риска
        const risk = insp.riskLevel || 'medium';
        if (risk in byRiskLevel) {
            byRiskLevel[risk as keyof typeof byRiskLevel]++;
        }

        // С нарушениями
        if (insp.violationsCount && insp.violationsCount > 0) {
            withViolations++;
        }

        // С применением административной ответственности
        if (insp.adminResponsibilityApplied) {
            withAdminResponsibility++;
        }

        // Контрольные (follow-up)
        if (insp.isFollowUpInspection) {
            followUp++;
        }
    }

    return {
        total: allInspections.length,
        byType,
        byBasis,
        byRiskLevel,
        withViolations,
        withAdminResponsibility,
        followUp,
    };
}

/**
 * Агрегация данных по мерам оперативного реагирования
 */
async function getMeasuresAggregation(
    startDate: Date,
    endDate: Date,
    region?: string,
    district?: string
): Promise<Form13KPSMeasures> {
    const conditions = [
        gte(measures.measureDate, startDate),
        lte(measures.measureDate, endDate),
    ];

    if (region && region !== 'Все') {
        conditions.push(eq(measures.region, region));
    }

    if (district && district !== 'Все') {
        conditions.push(eq(measures.district, district));
    }

    const allMeasures = await db
        .select()
        .from(measures)
        .where(and(...conditions));

    let primary = 0;
    let repeat = 0;
    const byStatus = {
        issued: 0,
        in_progress: 0,
        completed: 0,
    };

    for (const m of allMeasures) {
        // Первичные vs повторные
        if (m.isRepeat) {
            repeat++;
        } else {
            primary++;
        }

        // По статусу
        if (m.status === 'issued') byStatus.issued++;
        else if (m.status === 'in_progress') byStatus.in_progress++;
        else if (m.status === 'completed') byStatus.completed++;
    }

    return {
        total: allMeasures.length,
        primary,
        repeat,
        byStatus,
    };
}

/**
 * Агрегация данных по организациям
 */
async function getOrganizationsAggregation(
    region?: string,
    district?: string
): Promise<Form13KPSOrganizations> {
    const conditions = [];

    if (region && region !== 'Все') {
        conditions.push(eq(organizationsRegistry.region, region));
    }

    if (district && district !== 'Все') {
        conditions.push(eq(organizationsRegistry.district, district));
    }

    const allOrgs = await db
        .select()
        .from(organizationsRegistry)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

    const byType = {
        government: 0,
        small_business: 0,
        medium_business: 0,
        large_business: 0,
        individual: 0,
    };

    for (const org of allOrgs) {
        if (org.type in byType) {
            byType[org.type as keyof typeof byType]++;
        }
    }

    return {
        total: allOrgs.length,
        byType,
    };
}

export const form13KpsController = {
    getReport: getForm13KPSReport,
};
