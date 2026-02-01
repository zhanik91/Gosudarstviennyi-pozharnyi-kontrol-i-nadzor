import { Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../storage/db";
import { orgUnits, users } from "@shared/schema";

// Данные для генерации
const INCIDENT_TYPES = ['fire', 'nonfire', 'steppe_fire', 'steppe_smolder', 'co_nofire'] as const;
const LOCALITIES = ['cities', 'rural'] as const;

const REGION_NAMES = [
    "г. Астана", "г. Алматы", "г. Шымкент", "Область Абай", "Акмолинская область",
    "Актюбинская область", "Алматинская область", "Атырауская область",
    "Восточно-Казахстанская область", "Жамбылская область", "Область Жетісу",
    "Западно-Казахстанская область", "Карагандинская область", "Костанайская область",
    "Кызылординская область", "Мангистауская область", "Павлодарская область",
    "Северо-Казахстанская область", "Туркестанская область", "Область Ұлытау"
];

const ADDRESSES = [
    "пр. Кабанбай батыра, д. 15", "ул. Достык, д. 23", "ул. Иманова, д. 45",
    "пр. Абая, д. 12", "ул. Фурманова, д. 56", "ул. Тимирязева, д. 78",
    "пр. Тауке хана, д. 25", "ул. Байтурсынова, д. 43", "ул. Абая, д. 10",
    "ул. Назарбаева, д. 25", "ул. Ленина, д. 45", "ул. Гоголя, д. 12"
];

const FIRE_CAUSES = [
    { name: 'Установленные поджоги', code: '1' },
    { name: 'Неосторожное обращение с огнем', code: '10.1' },
    { name: 'Короткое замыкание', code: '3.1' },
    { name: 'Нарушение эксплуатации печей', code: '6.1' },
    { name: 'Оставление электроприборов', code: '4.1' },
    { name: 'Шалость детей с огнем', code: '12' }
];

const OBJECT_TYPES = [
    { type: 'Жилой дом', code: '14.1' },
    { type: 'Многоквартирный дом', code: '14.2' },
    { type: 'Производственное здание', code: '1.1' },
    { type: 'Автомобиль', code: '13.1.2' },
    { type: 'Торговый центр', code: '2.10' }
];

function randomItem<T>(array: readonly T[] | T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min: number, max: number, decimals = 2): string {
    return (Math.random() * (max - min) + min).toFixed(decimals);
}

function randomDate(): Date {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
}

function generateIncident(orgUnitId: string, createdBy: string, index: number) {
    const incidentType = randomItem(INCIDENT_TYPES);
    const region = randomItem(REGION_NAMES);
    const causeData = randomItem(FIRE_CAUSES);
    const objectData = randomItem(OBJECT_TYPES);

    const incident: any = {
        dateTime: randomDate(),
        locality: randomItem(LOCALITIES),
        incidentType,
        address: randomItem(ADDRESSES),
        description: `Тестовый инцидент #${index + 1}`,
        region,
        city: region,
        orgUnitId,
        createdBy,
        status: 'pending',
        cause: causeData.name,
        causeCode: causeData.code,
        objectType: objectData.type,
        objectCode: objectData.code,
        latitude: randomDecimal(40, 55, 7),
        longitude: randomDecimal(46, 87, 7)
    };

    if (incidentType === 'fire' || incidentType === 'steppe_fire') {
        incident.damage = randomDecimal(10, 5000, 2);
        incident.savedProperty = randomDecimal(0, 2000, 2);
        incident.deathsTotal = Math.random() > 0.85 ? randomInt(0, 3) : 0;
        incident.deathsChildren = incident.deathsTotal > 0 ? randomInt(0, 1) : 0;
        incident.injuredTotal = Math.random() > 0.7 ? randomInt(0, 5) : 0;
        incident.savedPeopleTotal = Math.random() > 0.6 ? randomInt(0, 10) : 0;
    }

    if (incidentType === 'steppe_fire' || incidentType === 'steppe_smolder') {
        incident.steppeArea = randomDecimal(100, 50000, 2);
        incident.steppeDamage = randomDecimal(50, 10000, 2);
    }

    if (incidentType === 'co_nofire') {
        incident.deathsCOTotal = Math.random() > 0.7 ? randomInt(0, 3) : 0;
        incident.injuredCOTotal = Math.random() > 0.5 ? randomInt(0, 5) : 0;
    }

    return incident;
}

export class GenerateController {
    async generateIncidents(req: Request, res: Response) {
        try {
            const count = parseInt(req.query.count as string) || 100;

            // Получаем организации и пользователей
            const allOrgs = await db.select().from(orgUnits);
            const allUsers = await db.select().from(users);

            if (allOrgs.length === 0 || allUsers.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Нет организаций или пользователей в БД'
                });
            }

            const orgUnitId = allOrgs[0].id;
            const createdBy = allUsers[0].id;

            // Генерируем инциденты
            const created = [];
            for (let i = 0; i < count; i++) {
                const incident = generateIncident(orgUnitId, createdBy, i);
                const result = await storage.createIncident(incident);
                created.push(result);
            }

            res.json({
                success: true,
                message: `Создано ${count} инцидентов`,
                count: created.length,
                orgUnit: allOrgs[0].name,
                user: allUsers[0].username
            });

        } catch (error: any) {
            console.error('Error generating incidents:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export const generateController = new GenerateController();
