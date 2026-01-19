import { db } from "../server/storage/db";
import { users } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
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
        .set({ passwordHash: hashedPassword, updatedAt: new Date() })
        .where(eq(users.username, username));
    } else {
      console.log("Creating new admin user...");
      const hashedPassword = await hashPassword(password);
      await db.insert(users).values({
        username,
        passwordHash: hashedPassword,
        fullName: "System Administrator",
        role: "MCHS",
        region: "system",
        district: "",
        isActive: true,
        mustChangeOnFirstLogin: false,
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
