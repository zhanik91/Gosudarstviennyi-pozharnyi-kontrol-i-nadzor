import "../config/env";
import { db } from "../storage/db";
import { users } from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin";

  console.log(`Seeding admin user: ${username}`);

  try {
    const existingUser = await db.select().from(users).where(eq(users.username, username));

    if (existingUser.length > 0) {
      console.log("Admin user already exists. Updating password...");
      const hashedPassword = await hashPassword(password);
      await db.update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.username, username));
    } else {
      console.log("Creating new admin user...");
      const hashedPassword = await hashPassword(password);
      await db.insert(users).values({
        username,
        password: hashedPassword,
        fullName: "System Administrator",
        role: "admin",
        region: "system",
        district: "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
