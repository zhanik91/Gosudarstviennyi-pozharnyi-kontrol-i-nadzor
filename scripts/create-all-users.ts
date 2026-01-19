import { db } from "../server/storage/db";
import { users } from "../shared/schema";
import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const allUsers = [
  // === МЧС РК (Администраторы) ===
  { id: "mchs_rk", username: "mchs", password: "mchs123", fullName: "МЧС Республики Казахстан", role: "admin", region: "Республика Казахстан", district: "" },
  
  // === ДЧС по областям (17 областей) ===
  { id: "dchs_akmola", username: "dchs_akmola", password: "dchs123", fullName: "ДЧС Акмолинской области", role: "editor", region: "Акмолинская", district: "" },
  { id: "dchs_aktobe", username: "dchs_aktobe", password: "dchs123", fullName: "ДЧС Актюбинской области", role: "editor", region: "Актюбинская", district: "" },
  { id: "dchs_almaty_obl", username: "dchs_almaty_obl", password: "dchs123", fullName: "ДЧС Алматинской области", role: "editor", region: "Алматинская", district: "" },
  { id: "dchs_atyrau", username: "dchs_atyrau", password: "dchs123", fullName: "ДЧС Атырауской области", role: "editor", region: "Атырауская", district: "" },
  { id: "dchs_vko", username: "dchs_vko", password: "dchs123", fullName: "ДЧС Восточно-Казахстанской области", role: "editor", region: "Восточно-Казахстанская", district: "" },
  { id: "dchs_zhambyl", username: "dchs_zhambyl", password: "dchs123", fullName: "ДЧС Жамбылской области", role: "editor", region: "Жамбылская", district: "" },
  { id: "dchs_zko", username: "dchs_zko", password: "dchs123", fullName: "ДЧС Западно-Казахстанской области", role: "editor", region: "Западно-Казахстанская", district: "" },
  { id: "dchs_karaganda", username: "dchs_karaganda", password: "dchs123", fullName: "ДЧС Карагандинской области", role: "editor", region: "Карагандинская", district: "" },
  { id: "dchs_kostanay", username: "dchs_kostanay", password: "dchs123", fullName: "ДЧС Костанайской области", role: "editor", region: "Костанайская", district: "" },
  { id: "dchs_kyzylorda", username: "dchs_kyzylorda", password: "dchs123", fullName: "ДЧС Кызылординской области", role: "editor", region: "Кызылординская", district: "" },
  { id: "dchs_mangistau", username: "dchs_mangistau", password: "dchs123", fullName: "ДЧС Мангистауской области", role: "editor", region: "Мангистауская", district: "" },
  { id: "dchs_pavlodar", username: "dchs_pavlodar", password: "dchs123", fullName: "ДЧС Павлодарской области", role: "editor", region: "Павлодарская", district: "" },
  { id: "dchs_sko", username: "dchs_sko", password: "dchs123", fullName: "ДЧС Северо-Казахстанской области", role: "editor", region: "Северо-Казахстанская", district: "" },
  { id: "dchs_turkestan", username: "dchs_turkestan", password: "dchs123", fullName: "ДЧС Туркестанской области", role: "editor", region: "Туркестанская", district: "" },
  { id: "dchs_ulytau", username: "dchs_ulytau", password: "dchs123", fullName: "ДЧС Улытауской области", role: "editor", region: "Улытауская", district: "" },
  { id: "dchs_abay", username: "dchs_abay", password: "dchs123", fullName: "ДЧС области Абай", role: "editor", region: "Область Абай", district: "" },
  { id: "dchs_zhetisu", username: "dchs_zhetisu", password: "dchs123", fullName: "ДЧС области Жетісу", role: "editor", region: "Область Жетісу", district: "" },
  
  // === ДЧС городов республиканского значения (3 города) ===
  { id: "dchs_astana", username: "dchs_astana", password: "dchs123", fullName: "ДЧС города Астаны", role: "editor", region: "Астана", district: "" },
  { id: "dchs_almaty", username: "dchs_almaty", password: "dchs123", fullName: "ДЧС города Алматы", role: "editor", region: "Алматы", district: "" },
  { id: "dchs_shymkent", username: "dchs_shymkent", password: "dchs123", fullName: "ДЧС города Шымкент", role: "editor", region: "Шымкент", district: "" },
  
  // === ОЧС по крупным городам ===
  // Акмолинская область
  { id: "ochs_kokshetau", username: "ochs_kokshetau", password: "ochs123", fullName: "ОЧС города Кокшетау", role: "editor", region: "Акмолинская", district: "Кокшетау" },
  { id: "ochs_stepnogorsk", username: "ochs_stepnogorsk", password: "ochs123", fullName: "ОЧС города Степногорск", role: "editor", region: "Акмолинская", district: "Степногорск" },
  
  // Актюбинская область
  { id: "ochs_aktobe", username: "ochs_aktobe", password: "ochs123", fullName: "ОЧС города Актобе", role: "editor", region: "Актюбинская", district: "Актобе" },
  
  // Алматинская область
  { id: "ochs_taldykorgan", username: "ochs_taldykorgan", password: "ochs123", fullName: "ОЧС города Талдыкорган", role: "editor", region: "Алматинская", district: "Талдыкорган" },
  { id: "ochs_kapchagai", username: "ochs_kapchagai", password: "ochs123", fullName: "ОЧС города Капшагай", role: "editor", region: "Алматинская", district: "Капшагай" },
  
  // Атырауская область
  { id: "ochs_atyrau", username: "ochs_atyrau", password: "ochs123", fullName: "ОЧС города Атырау", role: "editor", region: "Атырауская", district: "Атырау" },
  
  // Восточно-Казахстанская область
  { id: "ochs_ust_kamenogorsk", username: "ochs_ust_kamenogorsk", password: "ochs123", fullName: "ОЧС города Усть-Каменогорск", role: "editor", region: "Восточно-Казахстанская", district: "Усть-Каменогорск" },
  
  // Область Абай
  { id: "ochs_semey", username: "ochs_semey", password: "ochs123", fullName: "ОЧС города Семей", role: "editor", region: "Область Абай", district: "Семей" },
  
  // Жамбылская область
  { id: "ochs_taraz", username: "ochs_taraz", password: "ochs123", fullName: "ОЧС города Тараз", role: "editor", region: "Жамбылская", district: "Тараз" },
  
  // Западно-Казахстанская область
  { id: "ochs_uralsk", username: "ochs_uralsk", password: "ochs123", fullName: "ОЧС города Уральск", role: "editor", region: "Западно-Казахстанская", district: "Уральск" },
  
  // Карагандинская область
  { id: "ochs_karaganda", username: "ochs_karaganda", password: "ochs123", fullName: "ОЧС города Караганда", role: "editor", region: "Карагандинская", district: "Караганда" },
  { id: "ochs_temirtau", username: "ochs_temirtau", password: "ochs123", fullName: "ОЧС города Темиртау", role: "editor", region: "Карагандинская", district: "Темиртау" },
  { id: "ochs_balkhash", username: "ochs_balkhash", password: "ochs123", fullName: "ОЧС города Балхаш", role: "editor", region: "Карагандинская", district: "Балхаш" },
  
  // Улытауская область
  { id: "ochs_zhezkazgan", username: "ochs_zhezkazgan", password: "ochs123", fullName: "ОЧС города Жезказган", role: "editor", region: "Улытауская", district: "Жезказган" },
  { id: "ochs_satbayev", username: "ochs_satbayev", password: "ochs123", fullName: "ОЧС города Сатпаев", role: "editor", region: "Улытауская", district: "Сатпаев" },
  
  // Костанайская область
  { id: "ochs_kostanay", username: "ochs_kostanay", password: "ochs123", fullName: "ОЧС города Костанай", role: "editor", region: "Костанайская", district: "Костанай" },
  { id: "ochs_rudny", username: "ochs_rudny", password: "ochs123", fullName: "ОЧС города Рудный", role: "editor", region: "Костанайская", district: "Рудный" },
  { id: "ochs_lisakovsk", username: "ochs_lisakovsk", password: "ochs123", fullName: "ОЧС города Лисаковск", role: "editor", region: "Костанайская", district: "Лисаковск" },
  
  // Кызылординская область
  { id: "ochs_kyzylorda", username: "ochs_kyzylorda", password: "ochs123", fullName: "ОЧС города Кызылорда", role: "editor", region: "Кызылординская", district: "Кызылорда" },
  
  // Мангистауская область
  { id: "ochs_aktau", username: "ochs_aktau", password: "ochs123", fullName: "ОЧС города Актау", role: "editor", region: "Мангистауская", district: "Актау" },
  { id: "ochs_zhanaozen", username: "ochs_zhanaozen", password: "ochs123", fullName: "ОЧС города Жанаозен", role: "editor", region: "Мангистауская", district: "Жанаозен" },
  
  // Павлодарская область
  { id: "ochs_pavlodar", username: "ochs_pavlodar", password: "ochs123", fullName: "ОЧС города Павлодар", role: "editor", region: "Павлодарская", district: "Павлодар" },
  { id: "ochs_ekibastuz", username: "ochs_ekibastuz", password: "ochs123", fullName: "ОЧС города Экибастуз", role: "editor", region: "Павлодарская", district: "Экибастуз" },
  { id: "ochs_aksu", username: "ochs_aksu", password: "ochs123", fullName: "ОЧС города Аксу", role: "editor", region: "Павлодарская", district: "Аксу" },
  
  // Северо-Казахстанская область
  { id: "ochs_petropavlovsk", username: "ochs_petropavlovsk", password: "ochs123", fullName: "ОЧС города Петропавловск", role: "editor", region: "Северо-Казахстанская", district: "Петропавловск" },
  
  // Туркестанская область
  { id: "ochs_turkestan", username: "ochs_turkestan", password: "ochs123", fullName: "ОЧС города Туркестан", role: "editor", region: "Туркестанская", district: "Туркестан" },
  { id: "ochs_kentau", username: "ochs_kentau", password: "ochs123", fullName: "ОЧС города Кентау", role: "editor", region: "Туркестанская", district: "Кентау" },
  { id: "ochs_arys", username: "ochs_arys", password: "ochs123", fullName: "ОЧС города Арыс", role: "editor", region: "Туркестанская", district: "Арыс" },
  
  // Область Жетісу
  { id: "ochs_taldykorgan2", username: "ochs_zhetisu", password: "ochs123", fullName: "ОЧС области Жетісу", role: "editor", region: "Область Жетісу", district: "Талдыкорган" },
];

async function main() {
  console.log("Создание полного списка пользователей...\n");

  let created = 0;
  let skipped = 0;

  for (const userData of allUsers) {
    const passwordHash = await hashPassword(userData.password);

    try {
      await db.insert(users).values({
        id: userData.id,
        username: userData.username,
        passwordHash: passwordHash,
        fullName: userData.fullName,
        role: userData.role as any,
        region: userData.region,
        district: userData.district,
        isActive: true,
        mustChangeOnFirstLogin: false,
        createdAt: new Date(),
      });
      console.log(`✓ ${userData.username}`);
      created++;
    } catch (error: any) {
      if (error.code === '23505') {
        console.log(`○ ${userData.username} (уже существует)`);
        skipped++;
      } else {
        console.error(`✗ ${userData.username}: ${error.message}`);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`Создано: ${created} | Пропущено: ${skipped}`);
  console.log(`Всего в системе: ${created + skipped + 3} пользователей`);
  console.log(`========================================`);
  
  console.log(`\n=== УЧЕТНЫЕ ЗАПИСИ ===\n`);
  console.log(`МЧС РК (администратор): mchs / mchs123`);
  console.log(`Существующие админы: admin / admin123, mchs_admin / admin123`);
  console.log(`\nВсе ДЧС: dchs_[регион] / dchs123`);
  console.log(`Все ОЧС: ochs_[город] / ochs123`);

  process.exit(0);
}

main();
