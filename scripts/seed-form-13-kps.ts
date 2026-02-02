// Seed script for Form 13-KPS test data
// Генерация тестовых данных для формы 13-КПС
// Запуск: npx tsx scripts/seed-form-13-kps.ts

import { db } from '../server/db';
import {
    organizationsRegistry,
    inspections,
    measures,
    controlObjects,
} from '../shared/schema';

const REGIONS = ['Алматы', 'Астана', 'Шымкент', 'Атырау', 'Актобе', 'Караганда', 'Павлодар'];

async function seedForm13KPS() {
    console.log('🌱 Seeding Form 13-KPS test data...');

    try {
        // 1. Создать организации в реестре
        console.log('Creating organizations...');
        const orgs = await db.insert(organizationsRegistry).values([
            // Государственные организации (20%)
            {
                bin: '001234567890',
                name: 'ГКП "Городская больница №1"',
                type: 'government',
                isGovernment: true,
                region: 'Алматы',
                district: 'Алмалинский',
            },
            {
                bin: '001234567891',
                name: 'КГУ "Школа №25"',
                type: 'government',
                isGovernment: true,
                region: 'Астана',
                district: 'Есильский',
            },
            // Малый бизнес (40%)
            {
                bin: '201234567890',
                name: 'ТОО "Кофейня Астана"',
                type: 'small_business',
                isGovernment: false,
                region: 'Астана',
                district: 'Сарыаркинский',
            },
            {
                bin: '201234567891',
                name: 'ИП "Продуктовый магазин"',
                type: 'small_business',
                isGovernment: false,
                region: 'Алматы',
                district: 'Бостандыкский',
            },
            // Средний бизнес (30%)
            {
                bin: '301234567890',
                name: 'ТОО "Торговый центр Mega"',
                type: 'medium_business',
                isGovernment: false,
                region: 'Алматы',
                district: 'Ауэзовский',
            },
            {
                bin: '301234567891',
                name: 'АО "Производственная компания"',
                type: 'medium_business',
                isGovernment: false,
                region: 'Шымкент',
                district: 'Каратауский',
            },
            // Крупный бизнес (10%)
            {
                bin: '401234567890',
                name: 'АО "Крупный завод"',
                type: 'large_business',
                isGovernment: false,
                region: 'Павлодар',
                district: 'Павлодар',
            },
        ]).returning();

        console.log(`✅ Created ${orgs.length} organizations`);

        // Получить первый orgUnit для связи
        const { rows: orgUnits } = await db.execute<{ id: string }>('SELECT id FROM org_units LIMIT 1');
        const orgUnitId = orgUnits[0]?.id || 'default-org-unit';

        // 2. Создать объекты контроля (привязать к организациям)
        console.log('Creating control objects...');
        const objects = await db.insert(controlObjects).values([
            {
                name: 'Здание больницы',
                category: 'medical',
                address: 'Алматы, ул. Абая 123',
                region: 'Алматы',
                district: 'Алмалинский',
                riskLevel: 'high',
                organizationBin: '001234567890',
                orgUnitId: orgUnitId,
                createdBy: 'system',
            },
            {
                name: 'Школа №25',
                category: 'educational',
                address: 'Астана, пр. Кабанбай батыра 45',
                region: 'Астана',
                district: 'Есильский',
                riskLevel: 'medium',
                organizationBin: '001234567891',
                orgUnitId: orgUnitId,
                createdBy: 'system',
            },
            {
                name: 'Кофейня',
                category: 'cafe',
                address: 'Астана, ул. Достык 12',
                region: 'Астана',
                district: 'Сарыаркинский',
                riskLevel: 'low',
                organizationBin: '201234567890',
                orgUnitId: orgUnitId,
                createdBy: 'system',
            },
        ]).returning();

        console.log(`✅ Created ${objects.length} control objects`);

        // 3. Создать проверки разных типов
        console.log('Creating inspections...');
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const insp = await db.insert(inspections).values([
            // Профилактический контроль (высокий риск)
            {
                number: 'ПК-001-2025',
                inspectionDate: lastMonth,
                type: 'preventive_control',
                status: 'completed',
                inspectionBasis: 'plan',
                riskLevel: 'high',
                controlObjectId: objects[0].id,
                organizationBin: '001234567890',
                region: 'Алматы',
                district: 'Алмалинский',
                bin: '001234567890',
                subjectName: orgs[0].name,
                violationsCount: 3,
                adminResponsibilityApplied: false, // ❗ При проф контроле НЕ применяется
                orgUnitId: orgUnitId,
                createdBy: 'system',
            },
            // Внеплановая проверка (по прокуратуре)
            {
                number: 'ВП-002-2025',
                inspectionDate: now,
                type: 'unscheduled',
                status: 'completed',
                inspectionBasis: 'prosecutor',
                riskLevel: 'medium',
                controlObjectId: objects[1].id,
                organizationBin: '001234567891',
                region: 'Астана',
                district: 'Есильский',
                bin: '001234567891',
                subjectName: orgs[1].name,
                violationsCount: 0,
                adminResponsibilityApplied: false,
                orgUnitId: orgUnitId,
                createdBy: 'system',
            },
            // Плановая проверка (низкий риск)
            {
                number: 'ПЛ-003-2025',
                inspectionDate: now,
                type: 'scheduled',
                status: 'completed',
                inspectionBasis: 'plan',
                riskLevel: 'low',
                controlObjectId: objects[2].id,
                organizationBin: '201234567890',
                region: 'Астана',
                district: 'Сарыаркинский',
                bin: '201234567890',
                subjectName: orgs[2].name,
                violationsCount: 1,
                adminResponsibilityApplied: false,
                orgUnitId: orgUnitId,
                createdBy: 'system',
            },
        ]).returning();

        console.log(`✅ Created ${insp.length} inspections`);

        // 4. Создать МОР для проверок с нарушениями
        console.log('Creating MOR (measures)...');
        const dueDate = new Date(lastMonth.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 дней
        const mors = await db.insert(measures).values([
            // МОР по первой проверке (профилактический контроль)
            {
                number: 'МОР-001-2025',
                relatedInspectionId: insp[0].id,
                measureDate: lastMonth,
                type: 'warning',
                status: 'issued',
                isRepeat: false,
                openedAt: lastMonth,
                dueDate: dueDate,
                region: 'Алматы',
                district: 'Алмалинский',
                bin: '001234567890',
                description: 'Выявлены нарушения требований пожарной безопасности',
            },
        ]).returning();

        console.log(`✅ Created ${mors.length} MOR`);

        // 5. Создать контрольную проверку и повторный МОР
        console.log('Creating follow-up inspection and repeat MOR...');
        const followUpInsp = await db.insert(inspections).values({
            number: 'КП-004-2025',
            inspectionDate: now,
            type: 'unscheduled',
            status: 'completed',
            inspectionBasis: 'prescription',
            riskLevel: 'high',
            controlObjectId: objects[0].id,
            organizationBin: '001234567890',
            parentInspectionId: insp[0].id, // Связь с первой проверкой
            isFollowUpInspection: true,
            region: 'Алматы',
            district: 'Алмалинский',
            bin: '001234567890',
            subjectName: orgs[0].name,
            violationsCount: 2, // Нарушения всё ещё есть
            adminResponsibilityApplied: true, // ❗ Теперь МОЖНО админ ответственность
            orgUnitId: orgUnitId,
            createdBy: 'system',
        }).returning();

        const repeatDueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db.insert(measures).values({
            number: 'МОР-005-2025',
            relatedInspectionId: followUpInsp[0].id,
            measureDate: now,
            type: 'fine',
            status: 'issued',
            parentMeasureId: mors[0].id, // Связь с первым МОР
            isRepeat: true, // ❗ Повторный МОР
            openedAt: now,
            dueDate: repeatDueDate,
            followUpInspectionId: followUpInsp[0].id,
            region: 'Алматы',
            district: 'Алмалинский',
            bin: '001234567890',
            description: 'Повторный МОР с административной ответственностью',
        });

        console.log(`✅ Created follow-up inspection and repeat MOR`);

        console.log('\n🎉 Seed completed successfully!');
        console.log('\nCreated:');
        console.log(`  - ${orgs.length} organizations`);
        console.log(`  - ${objects.length} control objects`);
        console.log(`  - ${insp.length + 1} inspections`);
        console.log(`  - ${mors.length + 1} MOR`);
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

// Запуск seed
seedForm13KPS()
    .then(() => {
        console.log('✅ Seeding done');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    });
