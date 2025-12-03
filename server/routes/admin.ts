import { Router } from "express";
import { storage } from "../storage";
import { hashPassword } from "../auth-local";

const router = Router();

// Middleware для проверки прав администратора
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Недостаточно прав доступа" });
  }
  next();
};

// Получить список всех пользователей
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения списка пользователей:', error);
    res.status(500).json({ message: "Ошибка получения списка пользователей" });
  }
});

// Создать нового пользователя
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, fullName, role, region, district, isActive = true } = req.body;
    
    // Проверяем, что пользователь не существует
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
    }
    
    // Хешируем пароль
    const hashedPassword = await hashPassword(password);
    
    // Создаем пользователя
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      fullName,
      role: role as "admin" | "editor" | "reviewer" | "approver",
      region,
      district: district || "",
      isActive,
      organizationId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    res.status(500).json({ message: "Ошибка создания пользователя" });
  }
});

// Обновить пользователя
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, fullName, role, region, district, isActive } = req.body;
    
    const user = await storage.updateUser(id, {
      username,
      fullName,
      role: role as "admin" | "editor" | "reviewer" | "approver",
      region,
      district,
      isActive,
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
});

// Удалить пользователя
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Нельзя удалить самого себя
    if (req.user?.id === id) {
      return res.status(400).json({ message: "Нельзя удалить свою учетную запись" });
    }
    
    await storage.deleteUser(id);
    
    res.json({ message: "Пользователь успешно удален" });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ message: "Ошибка удаления пользователя" });
  }
});

export default router;