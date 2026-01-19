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

const usersToCreate = [
  {
    id: "mchs_rk",
    username: "mchs",
    password: "mchs123",
    fullName: "МЧС Республики Казахстан",
    role: "admin",
    region: "Республика Казахстан",
    district: "",
  },
  {
    id: "dchs_almaty_obl",
    username: "dchs_almaty",
    password: "dchs123",
    fullName: "ДЧС Алматинской области",
    role: "editor",
    region: "Алматинская",
    district: "",
  },
  {
    id: "dchs_karaganda",
    username: "dchs_karaganda",
    password: "dchs123",
    fullName: "ДЧС Карагандинской области",
    role: "editor",
    region: "Карагандинская",
    district: "",
  },
  {
    id: "ochs_almaty_city",
    username: "ochs_almaty",
    password: "ochs123",
    fullName: "ОЧС города Алматы",
    role: "editor",
    region: "Алматинская",
    district: "Алматы",
  },
  {
    id: "ochs_karaganda_city",
    username: "ochs_karaganda",
    password: "ochs123",
    fullName: "ОЧС города Караганда",
    role: "editor",
    region: "Карагандинская",
    district: "Караганда",
  },
];

async function main() {
  console.log("Creating clean users...");

  for (const userData of usersToCreate) {
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
      console.log(`Created user: ${userData.username} (password: ${userData.password})`);
    } catch (error: any) {
      if (error.code === '23505') {
        console.log(`User ${userData.username} already exists, skipping...`);
      } else {
        console.error(`Error creating ${userData.username}:`, error.message);
      }
    }
  }

  console.log("\n=== ГОТОВЫЕ УЧЕТНЫЕ ЗАПИСИ ===");
  console.log("МЧС РК (администратор):");
  console.log("  Логин: mchs | Пароль: mchs123");
  console.log("\nДЧС (областной уровень):");
  console.log("  Логин: dchs_almaty | Пароль: dchs123");
  console.log("  Логин: dchs_karaganda | Пароль: dchs123");
  console.log("\nОЧС (районный уровень):");
  console.log("  Логин: ochs_almaty | Пароль: ochs123");
  console.log("  Логин: ochs_karaganda | Пароль: ochs123");
  console.log("\nСуществующие админы:");
  console.log("  Логин: admin | Пароль: admin123");
  console.log("  Логин: mchs_admin | Пароль: admin123");

  process.exit(0);
}

main();
