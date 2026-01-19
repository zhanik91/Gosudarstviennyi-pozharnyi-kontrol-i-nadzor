import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupLocalAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mchs-rk-portal-secret-2025',
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'sessions'
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 часа
      httpOnly: true,
      secure: false // в production должно быть true
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.isActive) {
          return done(null, false, { message: 'Неверный логин или пароль' });
        }

        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Неверный логин или пароль' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, (user as any).id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      done(null, false);
    }
  });

  // Маршруты аутентификации
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, fullName, region, role: newUserRole = 'DISTRICT' } = req.body;
      
      // Проверяем права администратора
      const currentUserRole = (req.user as any)?.role;
      if (!req.isAuthenticated() || (currentUserRole !== 'MCHS' && currentUserRole !== 'admin')) {
        return res.status(403).json({ message: "Только администратор может создавать пользователей" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        passwordHash: hashedPassword,
        fullName,
        region,
        district: "",
        role: newUserRole,
        orgUnitId: null,
        mustChangeOnFirstLogin: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({ 
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        region: user.region,
        role: user.role
      });
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ message: "Ошибка создания пользователя" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    const user = req.user as any;
    
    // Обновляем время последнего входа
    try {
      await storage.updateUser(user.id, {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      });
    } catch (e) {
      console.error("Ошибка обновления времени входа:", e);
    }
    
    res.status(200).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      region: user.region,
      role: user.role,
      orgUnitId: user.orgUnitId,
      mustChangeOnFirstLogin: user.mustChangeOnFirstLogin
    });
  });

  const handleLogout = (req: any, res: any, next: any) => {
    req.logout((logoutError: any) => {
      if (logoutError) return next(logoutError);

      if (req.session) {
        req.session.destroy((sessionError: any) => {
          if (sessionError) return next(sessionError);

          res.clearCookie("connect.sid");
          if (req.method === "GET") {
            res.redirect("/");
          } else {
            res.sendStatus(200);
          }
        });
      } else {
        res.sendStatus(200);
      }
    });
  };

  app.post("/api/logout", handleLogout);
  app.get("/api/logout", handleLogout);

  app.post("/api/change-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Не авторизован" });
      }

      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ message: "Новый пароль обязателен" });
      }

      const user = req.user as any;
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, {
        passwordHash: hashedPassword,
        mustChangeOnFirstLogin: false,
        updatedAt: new Date(),
      });

      res.json({ ok: true });
    } catch (error) {
      console.error("Ошибка смены пароля:", error);
      res.status(500).json({ message: "Ошибка смены пароля" });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Не авторизован" });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      region: user.region,
      role: user.role,
      orgUnitId: user.orgUnitId,
      mustChangeOnFirstLogin: user.mustChangeOnFirstLogin
    });
  });

  // Получение списка пользователей (только для админа)
  app.get("/api/users", async (req, res) => {
    try {
      const userRole = (req.user as any)?.role;
      if (!req.isAuthenticated() || (userRole !== 'MCHS' && userRole !== 'admin')) {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const users = await storage.getAllUsers();
      const userList = users.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        region: user.region,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));
      
      res.json(userList);
    } catch (error) {
      console.error('Ошибка получения пользователей:', error);
      res.status(500).json({ message: "Ошибка получения списка пользователей" });
    }
  });

  // Деактивация пользователя (только для админа)
  app.put("/api/users/:id/deactivate", async (req, res) => {
    try {
      const adminRole = (req.user as any)?.role;
      if (!req.isAuthenticated() || (adminRole !== 'MCHS' && adminRole !== 'admin')) {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const userId = req.params.id;
      // В реальной системе лучше проверять по ID админа
      const targetUser = await storage.getUser(userId);
      if (targetUser?.role === 'MCHS') {
         return res.status(400).json({ message: "Нельзя деактивировать учетную запись МЧС" });
      }

      await storage.updateUser(userId, { isActive: false, updatedAt: new Date() });
      res.json({ message: "Пользователь деактивирован" });
    } catch (error) {
      console.error('Ошибка деактивации пользователя:', error);
      res.status(500).json({ message: "Ошибка деактивации пользователя" });
    }
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    if (
      req.user?.mustChangeOnFirstLogin &&
      !["/api/change-password", "/api/user", "/api/logout"].includes(req.path)
    ) {
      return res.status(403).json({ message: "Требуется сменить пароль", code: "PASSWORD_CHANGE_REQUIRED" });
    }
    return next();
  }
  res.status(401).json({ message: "Необходима авторизация" });
};
