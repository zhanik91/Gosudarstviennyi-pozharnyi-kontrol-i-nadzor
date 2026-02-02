/**
 * Контроллер отчета административной практики
 * Агрегация данных из журнала admin_cases для формирования отчета
 */

import { Request, Response } from 'express';
import { db } from '../db';
import { adminCases, organizationsRegistry } from '@shared/schema';
import { and, eq, gte, lte, sql, or, isNull } from 'drizzle-orm';

// Интерфейс данных для одной строки
interface AdminPracticeRowData {
    total: number;
    government: number;
    ngoIndividual: number;
    businessSmall: number;
    businessMedium: number;
    businessLarge: number;
}

// Интерфейс ответа API
interface AdminPracticeReportData {
    period: string;
    region: string;
    district: string;
    rows: Record<string, AdminPracticeRowData>;
    generatedAt: string;
}

// Тип организации по БИН
type OrgType = 'government' | 'ngoIndividual' | 'businessSmall' | 'businessMedium' | 'businessLarge';

/**
 * Определить тип организации по данным дела
 */
function getOrgType(adminCase: any, orgRegistry: Map<string, any>): OrgType {
    const bin = adminCase.orgBin || adminCase.bin;

    // Если есть в реестре организаций - берем тип оттуда
    if (bin && orgRegistry.has(bin)) {
        const org = orgRegistry.get(bin);
        switch (org.type) {
            case 'government': return 'government';
            case 'small_business': return 'businessSmall';
            case 'medium_business': return 'businessMedium';
            case 'large_business': return 'businessLarge';
            case 'individual': return 'ngoIndividual';
            default: return 'ngoIndividual';
        }
    }

    // Если нет БИН, но есть ИИН - физлицо
    if (!bin && (adminCase.offenderIin || adminCase.iin)) {
        return 'ngoIndividual';
    }

    // По умолчанию - НКО/физлица
    return 'ngoIndividual';
}

/**
 * Создать пустую строку данных
 */
function createEmptyRow(): AdminPracticeRowData {
    return {
        total: 0,
        government: 0,
        ngoIndividual: 0,
        businessSmall: 0,
        businessMedium: 0,
        businessLarge: 0,
    };
}

/**
 * Добавить значение к строке
 */
function addToRow(row: AdminPracticeRowData, orgType: OrgType, value: number = 1): void {
    row.total += value;
    row[orgType] += value;
}

/**
 * GET /api/reports/admin-practice
 * Получить данные для отчета административной практики
 */
export async function getAdminPracticeReport(req: Request, res: Response) {
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

        // Диапазон дат для периода
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        // Условия фильтрации
        const conditions = [
            gte(adminCases.caseDate, startDate),
            lte(adminCases.caseDate, endDate),
        ];

        if (region && region !== 'Все' && region !== 'Республика Казахстан (Свод)') {
            conditions.push(eq(adminCases.region, String(region)));
        }

        if (district && district !== 'Все') {
            conditions.push(eq(adminCases.district, String(district)));
        }

        // Загрузить все административные дела за период
        const allCases = await db
            .select()
            .from(adminCases)
            .where(and(...conditions));

        // Загрузить реестр организаций для определения типа
        const allOrgs = await db.select().from(organizationsRegistry);
        const orgRegistry = new Map(allOrgs.map(org => [org.bin, org]));

        // Инициализация строк отчета
        const rows: Record<string, AdminPracticeRowData> = {
            // Раздел II. Административная практика
            'row-4': createEmptyRow(),  // Общее количество взысканий
            'row-5': createEmptyRow(),  // Предупреждения
            'row-6': createEmptyRow(),  // Штрафы
            'row-7': createEmptyRow(),  // Сумма штрафов
            'row-8': createEmptyRow(),  // Штрафы на юрлиц
            'row-9': createEmptyRow(),  // Сумма штрафов на юрлиц
            'row-10': createEmptyRow(), // Штрафы на должностных лиц
            'row-11': createEmptyRow(), // Сумма штрафов на должностных лиц
            'row-12': createEmptyRow(), // Штрафы на физлиц
            'row-13': createEmptyRow(), // Сумма штрафов на физлиц
            'row-14': createEmptyRow(), // Добровольно оплаченные
            'row-15': createEmptyRow(), // Сумма добровольно оплаченных
            'row-16': createEmptyRow(), // Направлено для принудительного взыскания
            'row-17': createEmptyRow(), // Количество
            'row-18': createEmptyRow(), // Сумма
            'row-19': createEmptyRow(), // Взыскано принудительно
            'row-20': createEmptyRow(), // Количество
            'row-21': createEmptyRow(), // Сумма
            'row-22': createEmptyRow(), // Отсутствует информация
            'row-23': createEmptyRow(), // Количество
            'row-24': createEmptyRow(), // Сумма

            // Раздел II.I. Пожары
            'row-26': createEmptyRow(), // Взыскания по пожарам
            'row-27': createEmptyRow(), // Предупреждения
            'row-28': createEmptyRow(), // Штрафы
            'row-29': createEmptyRow(), // Сумма штрафов
            'row-30': createEmptyRow(), // Штрафы на юрлиц
            'row-31': createEmptyRow(), // Сумма
            'row-32': createEmptyRow(), // Штрафы на должностных лиц
            'row-33': createEmptyRow(), // Сумма
            'row-34': createEmptyRow(), // Штрафы на физлиц
            'row-35': createEmptyRow(), // Сумма

            // Раздел II.II. Протоколы в суд
            'row-37': createEmptyRow(), // Протоколы по ст.462 ч.3
            'row-38': createEmptyRow(), // Наложено судом штрафов
            'row-39': createEmptyRow(), // Сумма
            'row-40': createEmptyRow(), // Приостановление эксплуатации
            'row-41': createEmptyRow(), // Оставлено без рассмотрения
            'row-42': createEmptyRow(), // На рассмотрении
            'row-43': createEmptyRow(), // Отменено судом
            'row-44': createEmptyRow(), // Протесты прокуратуры

            // Раздел III. Общие сведения
            'row-46': createEmptyRow(), // Отказы в регистрации
            'row-47': createEmptyRow(), // Инспекторы с дисциплинаркой
        };

        // Обработка каждого дела
        for (const adminCase of allCases) {
            const orgType = getOrgType(adminCase, orgRegistry);
            const fineAmount = Number(adminCase.fineAmount) || 0;
            const isWarning = adminCase.penaltyType === 'Предупреждение' || adminCase.outcome === 'warning';
            const isFine = !isWarning && fineAmount > 0;

            // Определяем тип субъекта (юрлицо, должностное лицо, физлицо)
            const hasOrgBin = !!adminCase.orgBin;
            const hasOffenderIin = !!adminCase.offenderIin;
            const isLegalEntity = hasOrgBin;
            const isOfficial = hasOrgBin && hasOffenderIin; // Должностное лицо - есть и организация и ИИН
            const isIndividual = !hasOrgBin && hasOffenderIin;

            // Строка 4: Общее количество взысканий
            addToRow(rows['row-4'], orgType);

            // Строка 5: Предупреждения
            if (isWarning) {
                addToRow(rows['row-5'], orgType);
            }

            // Строка 6: Штрафы
            if (isFine) {
                addToRow(rows['row-6'], orgType);
            }

            // Строка 7: Сумма штрафов
            if (isFine) {
                addToRow(rows['row-7'], orgType, fineAmount);
            }

            // Строки 8-13: Распределение штрафов по типу субъекта
            if (isFine) {
                if (isLegalEntity && !isOfficial) {
                    addToRow(rows['row-8'], orgType);
                    addToRow(rows['row-9'], orgType, fineAmount);
                } else if (isOfficial) {
                    addToRow(rows['row-10'], orgType);
                    addToRow(rows['row-11'], orgType, fineAmount);
                } else if (isIndividual) {
                    addToRow(rows['row-12'], orgType);
                    addToRow(rows['row-13'], orgType, fineAmount);
                }
            }

            // Строки 14-15: Добровольно оплаченные
            if (adminCase.finePaidVoluntary) {
                addToRow(rows['row-14'], orgType);
                addToRow(rows['row-15'], orgType, fineAmount);
            }

            // Строки 16-18: Направлено для принудительного взыскания
            if (adminCase.enforcementSent && !adminCase.finePaidForced) {
                addToRow(rows['row-16'], orgType);
                addToRow(rows['row-17'], orgType);
                addToRow(rows['row-18'], orgType, fineAmount);
            }

            // Строки 19-21: Взыскано принудительно
            if (adminCase.finePaidForced) {
                addToRow(rows['row-19'], orgType);
                addToRow(rows['row-20'], orgType);
                addToRow(rows['row-21'], orgType, fineAmount);
            }

            // Строки 22-24: Отсутствует информация
            if (adminCase.enforcementSent && !adminCase.finePaidForced && !adminCase.finePaidVoluntary) {
                // Логика для отсутствия информации - пока оставляем как есть
            }

            // Раздел II.I - Пожары (если дело связано с пожаром)
            // Определяем по статье или типу
            const isFireRelated =
                (adminCase.article && (
                    adminCase.article.includes('пожар') ||
                    adminCase.article.includes('загоран') ||
                    adminCase.article.includes('угарн')
                )) ||
                adminCase.type === 'protocol'; // Упрощенная логика

            if (isFireRelated) {
                addToRow(rows['row-26'], orgType);

                if (isWarning) {
                    addToRow(rows['row-27'], orgType);
                }

                if (isFine) {
                    addToRow(rows['row-28'], orgType);
                    addToRow(rows['row-29'], orgType, fineAmount);

                    if (isLegalEntity && !isOfficial) {
                        addToRow(rows['row-30'], orgType);
                        addToRow(rows['row-31'], orgType, fineAmount);
                    } else if (isOfficial) {
                        addToRow(rows['row-32'], orgType);
                        addToRow(rows['row-33'], orgType, fineAmount);
                    } else if (isIndividual) {
                        addToRow(rows['row-34'], orgType);
                        addToRow(rows['row-35'], orgType, fineAmount);
                    }
                }
            }

            // Раздел II.II - Протоколы в суд
            // Проверяем по статье 462 ч.3
            const isCourtCase =
                adminCase.article && adminCase.article.includes('462') ||
                adminCase.transferTo?.toLowerCase().includes('суд');

            if (isCourtCase) {
                addToRow(rows['row-37'], orgType);

                if (adminCase.status === 'resolved' && isFine) {
                    addToRow(rows['row-38'], orgType);
                    addToRow(rows['row-39'], orgType, fineAmount);
                }

                if (adminCase.status === 'in_review') {
                    addToRow(rows['row-42'], orgType);
                }

                if (adminCase.status === 'canceled') {
                    addToRow(rows['row-43'], orgType);
                }
            }
        }

        const result: AdminPracticeReportData = {
            period: periodStr,
            region: region ? String(region) : 'Все',
            district: district ? String(district) : 'Все',
            rows,
            generatedAt: new Date().toISOString(),
        };

        return res.json(result);
    } catch (error) {
        console.error('Error generating Admin Practice report:', error);
        return res.status(500).json({ error: 'Ошибка при формировании отчёта' });
    }
}

export const adminPracticeReportController = {
    getReport: getAdminPracticeReport,
};
