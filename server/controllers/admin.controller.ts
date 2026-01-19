import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { hashPassword } from "../auth-local";

export class AdminController {

  // Middleware для проверки прав администратора
  requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated() || req.user?.role !== 'MCHS') {
      return res.status(403).json({ message: "Недостаточно прав доступа" });
    }
    next();
  }

  // Получить список всех пользователей
  async getUsers(req: Request, res: Response) {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Ошибка получения списка пользователей:', error);
      res.status(500).json({ message: "Ошибка получения списка пользователей" });
    }
  }

  // Создать нового пользователя
  async createUser(req: Request, res: Response) {
    try {
      const {
        username,
        password,
        fullName,
        role,
        region,
        district,
        isActive = true,
        orgUnitId,
        email,
        mustChangeOnFirstLogin = true
      } = req.body;

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        username,
        passwordHash: hashedPassword,
        fullName,
        email,
        role: role as "MCHS" | "DCHS" | "DISTRICT",
        region,
        district: district || "",
        isActive,
        orgUnitId: orgUnitId ?? null,
        mustChangeOnFirstLogin,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      res.status(500).json({ message: "Ошибка создания пользователя" });
    }
  }

  // Обновить пользователя
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        username,
        fullName,
        role,
        region,
        district,
        isActive,
        orgUnitId,
        mustChangeOnFirstLogin,
        email
      } = req.body;

      const user = await storage.updateUser(id, {
        username,
        fullName,
        email,
        role: role as "MCHS" | "DCHS" | "DISTRICT",
        region,
        district,
        isActive,
        orgUnitId,
        mustChangeOnFirstLogin,
        updatedAt: new Date()
      });

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      res.json(user);
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      res.status(500).json({ message: "Ошибка обновления пользователя" });
    }
  }

  // Удалить пользователя
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.id === id) {
        return res.status(400).json({ message: "Нельзя удалить свою учетную запись" });
      }

      await storage.deleteUser(id);

      res.json({ message: "Пользователь успешно удален" });
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      res.status(500).json({ message: "Ошибка удаления пользователя" });
    }
  }

  // Сбросить пароль пользователя
  async resetPassword(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.id === id) {
        return res.status(400).json({ message: "Нельзя сбросить свой пароль через этот метод" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Генерируем временный пароль
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      const temporaryPassword = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      
      const hashedPassword = await hashPassword(temporaryPassword);
      
      await storage.updateUser(id, {
        passwordHash: hashedPassword,
        mustChangeOnFirstLogin: true,
        updatedAt: new Date()
      });

      res.json({ 
        message: "Пароль успешно сброшен",
        temporaryPassword,
        username: user.username
      });
    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
      res.status(500).json({ message: "Ошибка сброса пароля" });
    }
  }
}

export const adminController = new AdminController();
