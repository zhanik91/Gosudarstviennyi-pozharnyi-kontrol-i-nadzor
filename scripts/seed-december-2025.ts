import { db } from "../server/storage/db";
import { incidents, reportForms, adminCases, orgUnits } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import XLSX from "xlsx";

const REGION_MAPPING: Record<string, string> = {
  "Абай": "Область Абай",
  "Акмолинская": "Акмолинская область",
  "Актюбинская": "Актюбинская область",
  "Алматинская": "Алматинская область",
  "Атырауская": "Атырауская область",
  "В. Казахстанская": "Восточно-Казахстанская область",
  "г.  Алматы": "г. Алматы",
  "г. Астана": "г. Астана",
  "Жамбылская": "Жамбылская область",
  "Жетысу": "Область Жетісу",
  "З. Казахстанская": "Западно-Казахстанская область",
  "Карагандинская": "Карагандинская область",
  "Кызылординскя": "Кызылординская область",
  "Костанайская": "Костанайская область",
  "Мангистауская": "Мангистауская область",
  "Павлодарская": "Павлодарская область",
  "С.Казахстанская": "Северо-Казахстанская область",
  "Туркестанская": "Туркестанская область",
  "Улытау": "Область Ұлытау",
  "г.Шымкент": "г. Шымкент",
};

const REGION_COLUMNS = [
  { col: 5, shortName: "Абай" },
  { col: 8, shortName: "Акмолинская" },
  { col: 11, shortName: "Актюбинская" },
  { col: 14, shortName: "Алматинская" },
  { col: 17, shortName: "Атырауская" },
  { col: 20, shortName: "В. Казахстанская" },
  { col: 23, shortName: "г.  Алматы" },
  { col: 26, shortName: "г. Астана" },
  { col: 29, shortName: "Жамбылская" },
  { col: 32, shortName: "Жетысу" },
  { col: 35, shortName: "З. Казахстанская" },
  { col: 38, shortName: "Карагандинская" },
  { col: 41, shortName: "Кызылординскя" },
  { col: 44, shortName: "Костанайская" },
  { col: 47, shortName: "Мангистауская" },
  { col: 50, shortName: "Павлодарская" },
  { col: 53, shortName: "С.Казахстанская" },
  { col: 56, shortName: "Туркестанская" },
  { col: 59, shortName: "Улытау" },
  { col: 62, shortName: "г.Шымкент" },
];

const DISTRICTS_BY_REGION: Record<string, string[]> = {
  "г. Астана": ["Алматинский район", "Байконурский район", "Есильский район", "Сарыаркинский район"],
  "г. Алматы": ["Алатауский район", "Алмалинский район", "Ауэзовский район", "Бостандыкский район", "Медеуский район"],
  "г. Шымкент": ["Абайский район", "Аль-Фарабийский район", "Енбекшинский район", "Каратауский район"],
  "Область Абай": ["город Семей", "Аягозский район", "Жарминский район", "Кокпектинский район"],
  "Акмолинская область": ["г. Кокшетау", "Аккольский район", "Атбасарский район", "Бурабайский район"],
  "Актюбинская область": ["г. Актобе", "Алгинский район", "Мартукский район", "Хромтауский район"],
  "Алматинская область": ["г. Конаев", "Илийский район", "Карасайский район", "Талгарский район"],
  "Атырауская область": ["г. Атырау", "Жылыойский район", "Курмангазинский район", "Макатский район"],
  "Восточно-Казахстанская область": ["г. Усть-Каменогорск", "г. Риддер", "Глубоковский район", "Уланский район"],
  "Жамбылская область": ["г. Тараз", "Байзакский район", "Кордайский район", "Меркенский район"],
  "Область Жетісу": ["город Талдыкорган", "Алакольский район", "Аксуский район", "Панфиловский район"],
  "Западно-Казахстанская область": ["г. Уральск", "Акжаикский район", "Бурлинский район", "Теректинский район"],
  "Карагандинская область": ["г. Караганда", "г. Темиртау", "Бухар-Жырауский район", "Нуринский район"],
  "Костанайская область": ["г. Костанай", "г. Рудный", "Карабалыкский район", "Костанайский район"],
  "Кызылординская область": ["г. Кызылорда", "Аральский район", "Жалагашский район", "Казалинский район"],
  "Мангистауская область": ["г. Актау", "г. Жанаозен", "Мунайлинский район", "Каракиянский район"],
  "Павлодарская область": ["г. Павлодар", "г. Аксу", "г. Экибастуз", "Павлодарский район"],
  "Северо-Казахстанская область": ["г. Петропавловск", "Кызылжарский район", "Тайыншинский район", "Мамлютский район"],
  "Туркестанская область": ["г. Туркестан", "г. Кентау", "Сарыагашский район", "Толебийский район"],
  "Область Ұлытау": ["город Жезказган", "Жанааркинский район", "Ұлытауский район"],
};

const FIRE_CAUSES_LIST = [
  "Нарушение правил устройства и эксплуатации электрооборудования",
  "Неосторожное обращение с огнём",
  "Нарушение правил устройства и эксплуатации печей",
  "Поджог",
  "Нарушение ПДД",
  "Детская шалость с огнём",
  "Неисправность производственного оборудования",
];

const OBJECT_TYPES_LIST = [
  "Жилой сектор",
  "Производственные здания",
  "Административные здания",
  "Транспортные средства",
  "Торговые объекты",
  "Складские помещения",
  "Объекты образования",
];

async function getOrCreateOrgUnit(regionName: string): Promise<string> {
  const existing = await db
    .select()
    .from(orgUnits)
    .where(eq(orgUnits.name, regionName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const [newOrg] = await db
    .insert(orgUnits)
    .values({
      name: regionName,
      type: "DCHS",
      regionName: regionName,
      isActive: true,
    })
    .returning();

  return newOrg.id;
}

async function seedForm1Data() {
  console.log("Parsing Form 1 data from Excel...");

  const wb = XLSX.readFile("attached_assets/СВОД_декабрь_2025_корректировка_Караганда_1770264856146.xls");
  const sheet1 = wb.Sheets["Ф1"];
  const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1, range: 0 }) as any[][];

  const period = "2025-12";

  for (const regionCol of REGION_COLUMNS) {
    const regionName = REGION_MAPPING[regionCol.shortName];
    if (!regionName) continue;

    const orgUnitId = await getOrCreateOrgUnit(regionName);

    const val = (row: number, offset = 0) => {
      const v = data1[row]?.[regionCol.col + offset];
      return typeof v === "number" ? v : 0;
    };

    const form1Data = {
      fires_total: val(5, 0),
      fires_cities: val(5, 1),
      fires_rural: val(5, 2),
      damage_total: val(6, 0),
      damage_cities: val(6, 1),
      damage_rural: val(6, 2),
      deaths_total: val(7, 0),
      deaths_cities: val(7, 1),
      deaths_rural: val(7, 2),
      deaths_children: val(8, 0),
      deaths_drunk: val(9, 0),
      deaths_co_total: val(10, 0),
      deaths_co_children: val(11, 0),
      injured_total: val(12, 0),
      injured_children: val(13, 0),
      injured_co_total: val(14, 0),
      injured_co_children: val(15, 0),
      saved_people_total: val(16, 0),
      saved_children: val(17, 0),
      saved_property: val(18, 0),
    };

    console.log(`Inserting Form 1 for ${regionName}: ${form1Data.fires_total} fires`);

    await db
      .insert(reportForms)
      .values({
        orgUnitId,
        period,
        form: "1-osp",
        data: form1Data,
        status: "submitted",
      })
      .onConflictDoUpdate({
        target: [reportForms.orgUnitId, reportForms.period, reportForms.form],
        set: { data: form1Data, updatedAt: new Date() },
      });
  }

  console.log("Form 1 data seeded successfully!");
}

async function seedForm2Data() {
  console.log("Parsing Form 2 data from Excel...");

  const wb = XLSX.readFile("attached_assets/СВОД_декабрь_2025_корректировка_Караганда_1770264856146.xls");
  const sheet2 = wb.Sheets["Ф2"];
  const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1, range: 0 }) as any[][];

  const period = "2025-12";
  const regionNames = [
    "г. Астана", "г. Алматы", "г. Шымкент", "Область Абай", "Акмолинская область",
    "Актюбинская область", "Алматинская область", "Атырауская область",
    "Восточно-Казахстанская область", "Жамбылская область", "Область Жетісу",
    "Западно-Казахстанская область", "Карагандинская область", "Кызылординская область",
    "Костанайская область", "Мангистауская область", "Павлодарская область",
    "Северо-Казахстанская область", "Туркестанская область", "Область Ұлытау",
  ];

  for (let i = 0; i < regionNames.length; i++) {
    const regionName = regionNames[i];
    const orgUnitId = await getOrCreateOrgUnit(regionName);
    const col = i + 3;

    const val = (row: number) => {
      const v = data2[row]?.[col];
      return typeof v === "number" ? v : 0;
    };

    const form2Data = {
      tech_process_fires: val(5),
      thermal_processing: val(6),
      static_discharges: val(7),
      short_circuits: val(8),
      smoke_cooking: val(9),
      open_territory_fires: val(10),
      suicide_attempts: val(11),
      dtp_fires: val(12),
      disasters_fires: val(13),
      co_deaths: val(14),
      pyrophoric: val(15),
    };

    console.log(`Inserting Form 2 for ${regionName}`);

    await db
      .insert(reportForms)
      .values({
        orgUnitId,
        period,
        form: "2-ssg",
        data: form2Data,
        status: "submitted",
      })
      .onConflictDoUpdate({
        target: [reportForms.orgUnitId, reportForms.period, reportForms.form],
        set: { data: form2Data, updatedAt: new Date() },
      });
  }

  console.log("Form 2 data seeded successfully!");
}

async function seedJanuary2026Incidents() {
  console.log("Creating demo incidents for January 2026...");

  const mchsOrg = await db
    .select()
    .from(orgUnits)
    .where(eq(orgUnits.type, "MCHS"))
    .limit(1);

  let defaultOrgId: string;
  if (mchsOrg.length > 0) {
    defaultOrgId = mchsOrg[0].id;
  } else {
    const [newOrg] = await db
      .insert(orgUnits)
      .values({
        name: "МЧС РК",
        type: "MCHS",
        isActive: true,
      })
      .returning();
    defaultOrgId = newOrg.id;
  }

  const demoIncidents: Array<typeof incidents.$inferInsert> = [];
  const regions = Object.keys(DISTRICTS_BY_REGION);

  for (let i = 0; i < 15; i++) {
    const region = regions[i % regions.length];
    const districts = DISTRICTS_BY_REGION[region];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const cause = FIRE_CAUSES_LIST[Math.floor(Math.random() * FIRE_CAUSES_LIST.length)];
    const objectType = OBJECT_TYPES_LIST[Math.floor(Math.random() * OBJECT_TYPES_LIST.length)];

    const day = Math.floor(Math.random() * 28) + 1;
    const hour = Math.floor(Math.random() * 24);
    const dateTime = new Date(2026, 0, day, hour, Math.floor(Math.random() * 60));

    const orgUnitId = await getOrCreateOrgUnit(region);

    demoIncidents.push({
      dateTime,
      locality: Math.random() > 0.5 ? "cities" : "rural",
      incidentType: "fire" as const,
      address: `${district}, ул. ${["Абая", "Назарбаева", "Республики", "Сейфуллина", "Жибек жолы"][Math.floor(Math.random() * 5)]}, д. ${Math.floor(Math.random() * 100) + 1}`,
      description: `Пожар в ${objectType.toLowerCase()}. Причина: ${cause.toLowerCase()}.`,
      cause,
      objectType,
      region,
      city: district,
      damage: String(Math.floor(Math.random() * 5000) + 100),
      deathsTotal: Math.random() > 0.9 ? 1 : 0,
      deathsChildren: 0,
      deathsDrunk: 0,
      injuredTotal: Math.random() > 0.85 ? Math.floor(Math.random() * 3) + 1 : 0,
      injuredChildren: 0,
      savedPeopleTotal: Math.random() > 0.7 ? Math.floor(Math.random() * 5) + 1 : 0,
      savedPeopleChildren: 0,
      savedProperty: String(Math.floor(Math.random() * 10000)),
      orgUnitId,
      createdBy: "system-seed",
      status: "pending" as const,
    });
  }

  for (const incident of demoIncidents) {
    await db.insert(incidents).values(incident);
  }

  console.log(`Created ${demoIncidents.length} demo incidents for January 2026`);
}

async function seedAdminCases() {
  console.log("Creating demo admin cases...");

  const regions = Object.keys(DISTRICTS_BY_REGION);
  const articles = ["ст.410", "ст.410-1", "ст.336", "ст.359", "ст.367", "ст.438", "ст.589"];

  for (let i = 0; i < 20; i++) {
    const region = regions[i % regions.length];
    const districts = DISTRICTS_BY_REGION[region];
    const district = districts[Math.floor(Math.random() * districts.length)];

    const day = Math.floor(Math.random() * 60) + 1;
    const caseDate = new Date(2025, 10 + Math.floor(day / 30), (day % 30) + 1);

    const fineAmount = [25000, 50000, 75000, 100000, 150000, 200000][Math.floor(Math.random() * 6)];
    const isPaid = Math.random() > 0.3;

    await db.insert(adminCases).values({
      number: `АД-${2025}-${String(i + 1).padStart(4, "0")}`,
      caseDate,
      type: "protocol",
      status: isPaid ? "resolved" : (Math.random() > 0.5 ? "in_review" : "opened"),
      paymentType: isPaid ? (Math.random() > 0.5 ? "voluntary" : "forced") : null,
      outcome: isPaid ? "warning" : null,
      region,
      district,
      article: articles[Math.floor(Math.random() * articles.length)],
      protocolNumber: `ПР-${2025}-${String(i + 1).padStart(4, "0")}`,
      protocolDate: caseDate,
      offenderName: ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Алиев А.А.", "Касымов К.К."][Math.floor(Math.random() * 5)],
      offenderIin: String(Math.floor(Math.random() * 900000000000) + 100000000000),
      inspectorName: ["Сержант Ахметов", "Лейтенант Омаров", "Капитан Жумабаев"][Math.floor(Math.random() * 3)],
      penaltyType: "Штраф",
      fineAmount: String(fineAmount),
      finePaidVoluntary: isPaid && Math.random() > 0.5,
      finePaidForced: isPaid && Math.random() > 0.5,
    });
  }

  console.log("Created 20 demo admin cases");
}

async function main() {
  try {
    console.log("Starting seed for December 2025 data...\n");

    await seedForm1Data();
    console.log("");

    await seedForm2Data();
    console.log("");

    await seedJanuary2026Incidents();
    console.log("");

    await seedAdminCases();
    console.log("");

    console.log("All data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

main();
