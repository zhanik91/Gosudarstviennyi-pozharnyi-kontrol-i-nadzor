import { storage } from "./storage";
import { hashPassword } from "./auth-local";
import { nanoid } from "nanoid";

export async function seedDatabase() {
  try {
    console.log("Проверка начальных данных...");
    
    // Проверяем, существует ли админ
    const adminUser = await storage.getUserByUsername("admin");
    
    if (!adminUser) {
      console.log("Создание администратора...");
      const hashedPassword = await hashPassword("admin123");
      
      await storage.createUser({
        id: nanoid(),
        username: "admin",
        password: hashedPassword,
        fullName: "Администратор МЧС РК",
        region: "Республика Казахстан",
        district: "",
        email: "admin@mchs.gov.kz",
        role: "admin",
        organizationId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log("✓ Администратор создан (логин: admin, пароль: admin123)");
    } else {
      console.log("✓ Администратор уже существует");
    }
    
    // Проверяем тестовых пользователей
    const testUsers = [
      {
        username: "mchs_rk",
        fullName: "МЧС РК",
        region: "Республика Казахстан",
        district: "",
        email: "mchs_rk@mchs.gov.kz",
        role: "approver" as const
      },
      {
        username: "almaty_city_mchs",
        fullName: "МЧС города Алматы",
        region: "Алматы (город)",
        district: "",
        email: "almaty@mchs.gov.kz",
        role: "editor" as const
      },
      {
        username: "astana_mchs",
        fullName: "МЧС города Астаны",
        region: "Астана (город)",
        district: "",
        email: "astana@mchs.gov.kz",
        role: "editor" as const
      },
      {
        username: "shymkent_mchs",
        fullName: "МЧС города Шымкент",
        region: "Шымкент (город)",
        district: "",
        email: "shymkent@mchs.gov.kz",
        role: "editor" as const
      }
    ];
    
    for (const userData of testUsers) {
      const existingUser = await storage.getUserByUsername(userData.username);
      if (!existingUser) {
        const hashedPassword = await hashPassword("mchs2025");
        await storage.createUser({
          id: nanoid(),
          ...userData,
          password: hashedPassword,
          organizationId: `${userData.region.toLowerCase()}-mchs`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`✓ Создан тестовый пользователь: ${userData.username}`);
      }
    }
    
    console.log("✓ Инициализация базы данных завершена");
  } catch (error) {
    console.error("Ошибка инициализации базы данных:", error);
  }
}
