import { db } from "../server/storage/db";
import { orgUnits, users } from "@shared/schema";
import XLSX from "xlsx";
 codex/implement-organizational-structure-and-rbac-6zbcx4
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

import bcrypt from "bcryptjs";
 main
import { and, eq, isNull, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

const DEFAULT_FILE_NAMES = ["generated_accounts.csv", "generated_accounts.xlsx"];
const MCHS_NAME = "МЧС Республики Казахстан";
 codex/implement-organizational-structure-and-rbac-6zbcx4
const scryptAsync = promisify(scrypt);

 main

type AccountRow = {
  level?: string;
  role?: string;
  region?: string;
  unit?: string;
  username?: string;
  temp_password?: string;
  must_change_on_first_login?: string | boolean | number;
};

function resolveFilePath(inputPath?: string) {
  if (inputPath) {
    return path.resolve(process.cwd(), inputPath);
  }

  for (const name of DEFAULT_FILE_NAMES) {
    const candidate = path.resolve(process.cwd(), name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error("generated_accounts.csv или generated_accounts.xlsx не найдены");
}

function toBoolean(value: AccountRow["must_change_on_first_login"]) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase());
  }
  return true;
}

 codex/implement-organizational-structure-and-rbac-6zbcx4
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}


 main
async function ensureOrgUnit(params: {
  type: "MCHS" | "DCHS" | "DISTRICT";
  name: string;
  parentId?: string | null;
  regionName?: string;
  unitName?: string;
}) {
  const parentCondition = params.parentId ? eq(orgUnits.parentId, params.parentId) : isNull(orgUnits.parentId);
  const [existing] = await db
    .select({ id: orgUnits.id })
    .from(orgUnits)
    .where(and(eq(orgUnits.type, params.type), eq(orgUnits.name, params.name), parentCondition));

  if (existing) {
    return existing.id;
  }

  const [created] = await db
    .insert(orgUnits)
    .values({
      type: params.type,
      name: params.name,
      parentId: params.parentId ?? null,
      regionName: params.regionName ?? "",
      unitName: params.unitName ?? "",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: orgUnits.id });

  return created.id;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const fileArgIndex = process.argv.findIndex((arg) => arg === "--file");
  const filePath = resolveFilePath(fileArgIndex >= 0 ? process.argv[fileArgIndex + 1] : undefined);
  const printCredentials = args.has("--print-credentials");
  const updatePasswords = args.has("--update-passwords");
  const mchsUsername = process.env.MCHS_USERNAME;

  const workbook = XLSX.readFile(filePath, { raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<AccountRow>(sheet, { defval: "" });

  if (!rows.length) {
    throw new Error("В файле отсутствуют строки с учетными записями");
  }

  const mchId = await ensureOrgUnit({
    type: "MCHS",
    name: MCHS_NAME,
    regionName: "Республика Казахстан",
  });

  const dchsMap = new Map<string, string>();

  for (const row of rows) {
    if (!row.level || !row.region) continue;
    if (row.level.toUpperCase() !== "DCHS") continue;
    const regionName = String(row.region).trim();
    const dchsId = await ensureOrgUnit({
      type: "DCHS",
      name: regionName,
      parentId: mchId,
      regionName,
    });
    dchsMap.set(regionName, dchsId);
  }

  for (const row of rows) {
    if (!row.level || row.level.toUpperCase() !== "DISTRICT") continue;
    const regionName = String(row.region).trim();
    const unitName = String(row.unit ?? "").trim();
    const parentId = dchsMap.get(regionName);
    if (!parentId) {
      throw new Error(`Не найден ДЧС для региона ${regionName}`);
    }

    await ensureOrgUnit({
      type: "DISTRICT",
      name: unitName,
      parentId,
      regionName,
      unitName,
    });
  }

  if (mchsUsername) {
    await db
      .update(users)
      .set({ role: "MCHS", orgUnitId: mchId, updatedAt: new Date() })
      .where(eq(users.username, mchsUsername));
  } else {
    await db
      .update(users)
      .set({ orgUnitId: mchId, updatedAt: new Date() })
      .where(eq(users.role, "MCHS"));
  }

  const createdUsers: Array<{ username: string; password?: string }> = [];

  for (const row of rows) {
    if (!row.username || !row.role) continue;
    const username = String(row.username).trim();
    const role = String(row.role).trim().toUpperCase() as "MCHS" | "DCHS" | "DISTRICT";
    const mustChangeOnFirstLogin = toBoolean(row.must_change_on_first_login);
    const regionName = String(row.region ?? "").trim();
    const unitName = String(row.unit ?? "").trim();

    let orgUnitId: string | null = null;
    if (role === "MCHS") {
      orgUnitId = mchId;
    } else if (role === "DCHS") {
      orgUnitId = dchsMap.get(regionName) ?? null;
    } else {
      const parentId = dchsMap.get(regionName);
      if (!parentId) {
        throw new Error(`Не найден ДЧС для региона ${regionName}`);
      }
      const [district] = await db
        .select({ id: orgUnits.id })
        .from(orgUnits)
        .where(and(eq(orgUnits.type, "DISTRICT"), eq(orgUnits.name, unitName), eq(orgUnits.parentId, parentId)));
      orgUnitId = district?.id ?? null;
    }

    const [existingUser] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.username, username));

    if (!existingUser) {
      const tempPassword = String(row.temp_password ?? "");
      if (!tempPassword) {
        throw new Error(`Отсутствует временный пароль для ${username}`);
      }
 codex/implement-organizational-structure-and-rbac-6zbcx4
      const passwordHash = await hashPassword(tempPassword);

      const passwordHash = await bcrypt.hash(tempPassword, 12);
 main
      await db.insert(users).values({
        username,
        passwordHash,
        role,
        region: regionName,
        district: unitName,
        fullName: username,
        orgUnitId,
        mustChangeOnFirstLogin,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdUsers.push({ username, password: tempPassword });
    } else {
      const updates: any = {
        role,
        orgUnitId,
        region: regionName,
        district: unitName,
        mustChangeOnFirstLogin,
        updatedAt: new Date(),
      };

      if (updatePasswords) {
        const tempPassword = String(row.temp_password ?? "");
        if (tempPassword) {
 codex/implement-organizational-structure-and-rbac-6zbcx4
          updates.passwordHash = await hashPassword(tempPassword);

          updates.passwordHash = await bcrypt.hash(tempPassword, 12);
 main
          createdUsers.push({ username, password: tempPassword });
        }
      }

      await db.update(users).set(updates).where(eq(users.id, existingUser.id));
    }
  }

  const [{ count: dchsCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orgUnits)
    .where(eq(orgUnits.type, "DCHS"));
  const [{ count: districtCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(orgUnits)
    .where(eq(orgUnits.type, "DISTRICT"));
  const [{ count: userCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  const expected = { dchs: 20, districts: 227, users: 247 };
  if (Number(dchsCount) !== expected.dchs || Number(districtCount) !== expected.districts || Number(userCount) !== expected.users) {
    throw new Error(
      `Sanity check failed: DCHS=${dchsCount}, DISTRICT=${districtCount}, users=${userCount}`
    );
  }

  if (printCredentials && createdUsers.length > 0) {
    console.log("Созданные учетные записи:");
    for (const entry of createdUsers) {
      console.log(`${entry.username}\t${entry.password}`);
    }
  }

  console.log("Seed completed successfully.");
}

main().catch((error) => {
  console.error("Seed error:", error.message);
  process.exit(1);
});
