/**
 * Скрипт для генерации пилотных данных Формы 13-КПС
 * Заполняет таблицы: organizationsRegistry, inspections, measures
 * 
 * Запуск: npx tsx scripts/seed-form-13-kps-pilot.ts
 */

import { db } from '../server/db';
import { organizationsRegistry, inspections, measures, controlObjects, orgUnits } from '../shared/schema';
import { sql } from 'drizzle-orm';

// Функция генерации случайного числа в диапазоне
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Функция случайного выбора элемента из массива
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Генерация случайного БИН (12 цифр)
const generateBIN = () => Array.from({ length: 12 }, () => randomInt(0, 9)).join('');

// Генерация случайного ИИН (12 цифр)
const generateIIN = () => Array.from({ length: 12 }, () => randomInt(0, 9)).join('');

// Регионы Казахстана
const REGIONS = [
    'г. Астана',
    'г. Алматы',
    'г. Шымкент',
    'Акмолинская область',
    'Актюбинская область',
    'Алматинская область',
    'Атырауская область',
    'Восточно-Казахстанская область'
];

// Типы организаций
const ORG_TYPES = ['government', 'small_business', 'medium_business', 'large_business', 'individual'] as const;

// Типы проверок
const INSPECTION_TYPES = ['scheduled', 'unscheduled', 'preventive_control', 'monitoring'] as const;

// Основания проверок
const INSPECTION_BASES = ['plan', 'prescription', 'prosecutor', 'complaint', 'pnsem', 'fire_incident', 'other'] as const;

// Степени риска
const RISK_LEVELS = ['low', 'medium', 'high'] as const;

// Статусы проверок
const INSPECTION_STATUSES = ['completed', 'in_progress'] as const;

// Статусы МОР
const MEASURE_STATUSES = ['issued', 'in_progress', 'completed'] as const;

// Типы МОР
const MEASURE_TYPES = ['warning', 'order', 'fine', 'suspension', 'other'] as const;

async function seed() {
    console.log('🚀 Запуск генерации пилотных данных для Формы 13-КПС...');

    // Получаем или создаём orgUnit для привязки данных
    const existingOrgUnits = await db.select().from(orgUnits).limit(1);
    let orgUnitId = existingOrgUnits[0]?.id;

    if (!orgUnitId) {
        const [newOrgUnit] = await db.insert(orgUnits).values({
            type: 'DCHS',
            name: 'ДЧС г. Астаны',
            regionName: 'г. Астана',
            code: 'DCH-AST-001'
        }).returning();
        orgUnitId = newOrgUnit.id;
        console.log('✅ Создан orgUnit:', orgUnitId);
    }

    // 1. Создаём организации в реестре (50 шт)
    console.log('📋 Создание организаций в реестре...');
    const orgNames = [
        'ТОО "КазМунайГаз"', 'АО "KEGOC"', 'ТОО "Астана-Моторс"', 'ИП Иванов А.С.',
        'АО "Казахтелеком"', 'ТОО "Алматы Сауда"', 'ТОО "Шымкент-Строй"', 'ИП Петров Б.К.',
        'АО "Казпочта"', 'ТОО "Актобе Логистик"', 'ТОО "Атырау Нефть"', 'ИП Сидоров В.Г.',
        'АО "Бакад"', 'Алматы City Hall', 'ТОО "Караганда Пром"', 'ТОО "Костанай Агро"',
        'ИП Козлов Г.Д.', 'АО "Павлодар Энерго"', 'ТОО "Семей Торг"', 'ИП Новиков Д.Е.',
        'Министерство образования', 'Акимат города Астаны', 'ГУ "Госпиталь №1"', 'Школа №123',
        'ТОО "МегаМаркет"', 'ТОО "СуперСтрой"', 'АО "КазТранс"', 'ТОО "АлмаМед"',
        'ИП Федоров Е.И.', 'ТОО "ШымСервис"', 'АО "АктобеЭнерго"', 'ТОО "АтырауТранс"',
        'ГКП "Водоканал"', 'ТОО "ТехноМир"', 'АО "КазАгро"', 'ТОО "АстанаЖилСервис"',
        'ИП Михайлов Ж.К.', 'ТОО "АлматыОтделка"', 'АО "КазИнтерСвязь"', 'ТОО "ЮжТранс"',
        'МЧС РК', 'ДЧС г. Алматы', 'ОГПС Астаны', 'ГУ "Больница №5"', 'Детский сад №45',
        'ТОО "Казахстан Пром"', 'АО "Алюмин"', 'ТОО "ЮК Логистик"', 'ИП Соколов З.И.', 'ТОО "Мегаполис"'
    ];

    const createdOrgs: string[] = [];
    for (let i = 0; i < 50; i++) {
        const bin = generateBIN();
        const orgType = randomChoice(ORG_TYPES);
        const region = randomChoice(REGIONS);
        const isGov = orgType === 'government';

        try {
            const [org] = await db.insert(organizationsRegistry).values({
                bin,
                iin: orgType === 'individual' ? generateIIN() : null,
                name: orgNames[i] || `Организация ${i + 1}`,
                type: orgType,
                isGovernment: isGov,
                region,
                district: `Район ${randomInt(1, 5)}`,
                address: `ул. ${['Абая', 'Назарбаева', 'Кунаева', 'Достык', 'Сатпаева'][randomInt(0, 4)]}, д. ${randomInt(1, 100)}`
            }).returning();
            createdOrgs.push(org.id);
        } catch (e) {
            // Пропускаем дубликаты БИН
        }
    }
    console.log(`✅ Создано ${createdOrgs.length} организаций`);

    // 2. Создаём проверки (100 шт за последние 3 месяца)
    console.log('🔍 Создание проверок...');
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const createdInspections: string[] = [];
    for (let i = 0; i < 100; i++) {
        const inspectionDate = new Date(
            threeMonthsAgo.getTime() +
            Math.random() * (now.getTime() - threeMonthsAgo.getTime())
        );

        const inspType = randomChoice(INSPECTION_TYPES);
        const inspBasis = randomChoice(INSPECTION_BASES);
        const riskLevel = randomChoice(RISK_LEVELS);
        const hasViolations = Math.random() > 0.3;
        const violationsCount = hasViolations ? randomInt(1, 15) : 0;
        const adminApplied = hasViolations && Math.random() > 0.5;
        const isFollowUp = Math.random() > 0.8;
        const region = randomChoice(REGIONS);

        try {
            const [insp] = await db.insert(inspections).values({
                number: `ПР-${now.getFullYear()}-${String(i + 1).padStart(5, '0')}`,
                inspectionDate,
                type: inspType,
                status: randomChoice(INSPECTION_STATUSES),
                inspectionBasis: inspBasis,
                riskLevel,
                violationsCount,
                adminResponsibilityApplied: adminApplied,
                isFollowUpInspection: isFollowUp,
                region,
                district: `Район ${randomInt(1, 5)}`,
                bin: generateBIN(),
                subjectName: orgNames[randomInt(0, orgNames.length - 1)],
                address: `ул. Примерная, д. ${randomInt(1, 200)}`,
                orgUnitId,
                createdBy: 'seed-script'
            }).returning();
            createdInspections.push(insp.id);
        } catch (e) {
            console.error('Ошибка создания проверки:', e);
        }
    }
    console.log(`✅ Создано ${createdInspections.length} проверок`);

    // 3. Создаём МОР (80 шт)
    console.log('⚡ Создание мер оперативного реагирования (МОР)...');
    let createdMeasuresCount = 0;
    for (let i = 0; i < 80; i++) {
        const measureDate = new Date(
            threeMonthsAgo.getTime() +
            Math.random() * (now.getTime() - threeMonthsAgo.getTime())
        );

        const isRepeat = Math.random() > 0.7;
        const status = randomChoice(MEASURE_STATUSES);
        const region = randomChoice(REGIONS);
        const relatedInspectionId = createdInspections.length > 0
            ? randomChoice(createdInspections)
            : null;

        try {
            await db.insert(measures).values({
                number: `МОР-${now.getFullYear()}-${String(i + 1).padStart(4, '0')}`,
                measureDate,
                type: randomChoice(MEASURE_TYPES),
                status,
                isRepeat,
                region,
                district: `Район ${randomInt(1, 5)}`,
                bin: generateBIN(),
                description: `Мера оперативного реагирования №${i + 1}`,
                relatedInspectionId,
                openedAt: measureDate,
                dueDate: new Date(measureDate.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 дней
                closedAt: status === 'completed' ? new Date(measureDate.getTime() + randomInt(5, 25) * 24 * 60 * 60 * 1000) : null
            });
            createdMeasuresCount++;
        } catch (e) {
            console.error('Ошибка создания МОР:', e);
        }
    }
    console.log(`✅ Создано ${createdMeasuresCount} МОР`);

    // 4. Выводим статистику
    console.log('\n📊 Статистика пилотных данных:');

    const orgsCount = await db.select({ count: sql<number>`count(*)` }).from(organizationsRegistry);
    const inspsCount = await db.select({ count: sql<number>`count(*)` }).from(inspections);
    const measuresCount = await db.select({ count: sql<number>`count(*)` }).from(measures);

    console.log(`   Организаций в реестре: ${orgsCount[0].count}`);
    console.log(`   Проверок: ${inspsCount[0].count}`);
    console.log(`   МОР: ${measuresCount[0].count}`);

    // Проверяем заполнение по типам
    const inspsByType = await db.execute(sql`
        SELECT type, COUNT(*) as count FROM inspections GROUP BY type
    `);
    console.log('\n   Проверки по типам:');
    for (const row of inspsByType.rows) {
        console.log(`     - ${row.type}: ${row.count}`);
    }

    const inspsByBasis = await db.execute(sql`
        SELECT inspection_basis, COUNT(*) as count FROM inspections GROUP BY inspection_basis
    `);
    console.log('\n   Проверки по основаниям:');
    for (const row of inspsByBasis.rows) {
        console.log(`     - ${row.inspection_basis || 'null'}: ${row.count}`);
    }

    const inspsByRisk = await db.execute(sql`
        SELECT risk_level, COUNT(*) as count FROM inspections GROUP BY risk_level
    `);
    console.log('\n   Проверки по степени риска:');
    for (const row of inspsByRisk.rows) {
        console.log(`     - ${row.risk_level || 'null'}: ${row.count}`);
    }

    const orgsByType = await db.execute(sql`
        SELECT type, COUNT(*) as count FROM organizations_registry GROUP BY type
    `);
    console.log('\n   Организации по типам:');
    for (const row of orgsByType.rows) {
        console.log(`     - ${row.type}: ${row.count}`);
    }

    console.log('\n✅ Генерация пилотных данных завершена!');
    console.log('📌 Теперь откройте Форму 13-КПС и выберите текущий месяц для просмотра данных.');

    process.exit(0);
}

seed().catch((err) => {
    console.error('❌ Ошибка при генерации данных:', err);
    process.exit(1);
});
