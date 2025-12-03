import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

const defaultSeedPassword = process.env.DEFAULT_USER_PASSWORD || randomBytes(12).toString("hex");
const defaultEmailDomain = process.env.DEFAULT_USER_EMAIL_DOMAIN;
let seedPasswordLogged = false;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Полная система учетных записей МЧС РК по областям и районам
const defaultUsers = [
  // Администрация МЧС РК
  {
    id: "mchs_admin",
    username: "mchs_admin", 
    password: "uQ8i5gAe",
    role: "admin",
    organizationId: "mcs-rk",
    region: "Республика Казахстан",
    district: "",
    fullName: "Администратор системы МЧС РК",
    isActive: true
  },
  {
    id: "mchs_rk",
    username: "mchs_rk",
    password: "hj9fWbvu", 
    role: "reviewer",
    organizationId: "mcs-rk",
    region: "Республика Казахстан",
    district: "",
    fullName: "МЧС Республики Казахстан",
    isActive: true
  },

  // Акмолинская область
  {
    id: "akmola_mchs",
    username: "akmola_mchs",
    password: "Ak2025mcs",
    role: "editor",
    organizationId: "akmola-mchs",
    region: "Акмолинская",
    district: "",
    fullName: "ДЧС Акмолинской области",
    isActive: true
  },
  {
    id: "astana_mchs",
    username: "astana_mchs", 
    password: "As2025mcs",
    role: "editor",
    organizationId: "astana-mchs",
    region: "Акмолинская",
    district: "Нур-Султан",
    fullName: "ГУ ДЧС г. Нур-Султан",
    isActive: true
  },
  {
    id: "kokshetau_mchs",
    username: "kokshetau_mchs",
    password: "Ko2025mcs", 
    role: "editor",
    organizationId: "kokshetau-mchs",
    region: "Акмолинская",
    district: "Кокшетау",
    fullName: "ГУ ДЧС г. Кокшетау",
    isActive: true
  },

  // Актюбинская область
  {
    id: "aktobe_mchs",
    username: "aktobe_mchs",
    password: "Ak2025mcs",
    role: "editor", 
    organizationId: "aktobe-mchs",
    region: "Актюбинская",
    district: "",
    fullName: "ДЧС Актюбинской области",
    isActive: true
  },
  {
    id: "aktobe_city_mchs",
    username: "aktobe_city_mchs",
    password: "Ac2025mcs",
    role: "editor",
    organizationId: "aktobe-city-mchs",
    region: "Актюбинская", 
    district: "Актобе",
    fullName: "ГУ ДЧС г. Актобе",
    isActive: true
  },

  // Алматинская область
  {
    id: "almaty_obl_mchs",
    username: "almaty_obl_mchs",
    password: "Ao2025mcs",
    role: "editor",
    organizationId: "almaty-obl-mchs",
    region: "Алматинская",
    district: "",
    fullName: "ДЧС Алматинской области",
    isActive: true
  },
  {
    id: "almaty_city_mchs",
    username: "almaty_city_mchs",
    password: "Al2025mcs",
    role: "editor", 
    organizationId: "almaty-city-mchs",
    region: "Алматинская",
    district: "Алматы",
    fullName: "ГУ ДЧС г. Алматы",
    isActive: true
  },
  {
    id: "kapchagai_mchs",
    username: "kapchagai_mchs",
    password: "Ka2025mcs",
    role: "editor",
    organizationId: "kapchagai-mchs",
    region: "Алматинская",
    district: "Капчагай",
    fullName: "ГУ ДЧС г. Капчагай",
    isActive: true
  },

  // Атырауская область
  {
    id: "atyrau_mchs",
    username: "atyrau_mchs",
    password: "At2025mcs",
    role: "editor",
    organizationId: "atyrau-mchs",
    region: "Атырауская",
    district: "",
    fullName: "ДЧС Атырауской области",
    isActive: true
  },
  {
    id: "atyrau_city_mchs",
    username: "atyrau_city_mchs",
    password: "Ac2025mcs",
    role: "editor",
    organizationId: "atyrau-city-mchs",
    region: "Атырауская",
    district: "Атырау",
    fullName: "ГУ ДЧС г. Атырау",
    isActive: true
  },

  // Восточно-Казахстанская область
  {
    id: "vko_mchs",
    username: "vko_mchs",
    password: "Vk2025mcs",
    role: "editor",
    organizationId: "vko-mchs",
    region: "Восточно-Казахстанская",
    district: "",
    fullName: "ДЧС ВКО",
    isActive: true
  },
  {
    id: "ust_kamenogorsk_mchs",
    username: "ust_kamenogorsk_mchs",
    password: "Uk2025mcs",
    role: "editor",
    organizationId: "ust-kamenogorsk-mchs",
    region: "Восточно-Казахстанская",
    district: "Усть-Каменогорск",
    fullName: "ГУ ДЧС г. Усть-Каменогорск",
    isActive: true
  },
  {
    id: "semey_mchs",
    username: "semey_mchs",
    password: "Se2025mcs",
    role: "editor",
    organizationId: "semey-mchs",
    region: "Восточно-Казахстанская",
    district: "Семей",
    fullName: "ГУ ДЧС г. Семей",
    isActive: true
  },

  // Жамбылская область
  {
    id: "zhambyl_mchs",
    username: "zhambyl_mchs",
    password: "Zh2025mcs",
    role: "editor",
    organizationId: "zhambyl-mchs",
    region: "Жамбылская",
    district: "",
    fullName: "ДЧС Жамбылской области",
    isActive: true
  },
  {
    id: "taraz_mchs",
    username: "taraz_mchs",
    password: "Ta2025mcs",
    role: "editor",
    organizationId: "taraz-mchs",
    region: "Жамбылская",
    district: "Тараз",
    fullName: "ГУ ДЧС г. Тараз",
    isActive: true
  },

  // Западно-Казахстанская область
  {
    id: "zko_mchs",
    username: "zko_mchs",
    password: "Zk2025mcs",
    role: "editor",
    organizationId: "zko-mchs",
    region: "Западно-Казахстанская",
    district: "",
    fullName: "ДЧС ЗКО",
    isActive: true
  },
  {
    id: "uralsk_mchs",
    username: "uralsk_mchs",
    password: "Ur2025mcs",
    role: "editor",
    organizationId: "uralsk-mchs",
    region: "Западно-Казахстанская",
    district: "Уральск",
    fullName: "ГУ ДЧС г. Уральск",
    isActive: true
  },

  // Карагандинская область
  {
    id: "karaganda_mchs",
    username: "karaganda_mchs",
    password: "Kr2025mcs",
    role: "editor",
    organizationId: "karaganda-mchs",
    region: "Карагандинская",
    district: "",
    fullName: "ДЧС Карагандинской области",
    isActive: true
  },
  {
    id: "karaganda_city_mchs",
    username: "karaganda_city_mchs",
    password: "Kc2025mcs",
    role: "editor",
    organizationId: "karaganda-city-mchs",
    region: "Карагандинская",
    district: "Караганда",
    fullName: "ГУ ДЧС г. Караганда",
    isActive: true
  },
  {
    id: "temirtau_mchs",
    username: "temirtau_mchs",
    password: "Te2025mcs",
    role: "editor",
    organizationId: "temirtau-mchs",
    region: "Карагандинская",
    district: "Темиртау",
    fullName: "ГУ ДЧС г. Темиртау",
    isActive: true
  },

  // Костанайская область
  {
    id: "kostanay_mchs",
    username: "kostanay_mchs",
    password: "Ko2025mcs",
    role: "editor",
    organizationId: "kostanay-mchs",
    region: "Костанайская",
    district: "",
    fullName: "ДЧС Костанайской области",
    isActive: true
  },
  {
    id: "kostanay_city_mchs",
    username: "kostanay_city_mchs",
    password: "Kc2025mcs",
    role: "editor",
    organizationId: "kostanay-city-mchs",
    region: "Костанайская",
    district: "Костанай",
    fullName: "ГУ ДЧС г. Костанай",
    isActive: true
  },
  {
    id: "rudny_mchs",
    username: "rudny_mchs",
    password: "Ru2025mcs",
    role: "editor",
    organizationId: "rudny-mchs",
    region: "Костанайская",
    district: "Рудный",
    fullName: "ГУ ДЧС г. Рудный",
    isActive: true
  },

  // Кызылординская область
  {
    id: "kyzylorda_mchs",
    username: "kyzylorda_mchs",
    password: "Ky2025mcs",
    role: "editor",
    organizationId: "kyzylorda-mchs",
    region: "Кызылординская",
    district: "",
    fullName: "ДЧС Кызылординской области",
    isActive: true
  },
  {
    id: "kyzylorda_city_mchs",
    username: "kyzylorda_city_mchs",
    password: "Kc2025mcs",
    role: "editor",
    organizationId: "kyzylorda-city-mchs",
    region: "Кызылординская",
    district: "Кызылорда",
    fullName: "ГУ ДЧС г. Кызылорда",
    isActive: true
  },

  // Мангистауская область
  {
    id: "mangistau_mchs",
    username: "mangistau_mchs",
    password: "Ma2025mcs",
    role: "editor",
    organizationId: "mangistau-mchs",
    region: "Мангистауская",
    district: "",
    fullName: "ДЧС Мангистауской области",
    isActive: true
  },
  {
    id: "aktau_mchs",
    username: "aktau_mchs",
    password: "Ak2025mcs",
    role: "editor",
    organizationId: "aktau-mchs",
    region: "Мангистауская",
    district: "Актау",
    fullName: "ГУ ДЧС г. Актау",
    isActive: true
  },

  // Павлодарская область
  {
    id: "pavlodar_mchs",
    username: "pavlodar_mchs",
    password: "Pa2025mcs",
    role: "editor",
    organizationId: "pavlodar-mchs",
    region: "Павлодарская",
    district: "",
    fullName: "ДЧС Павлодарской области",
    isActive: true
  },
  {
    id: "pavlodar_city_mchs",
    username: "pavlodar_city_mchs",
    password: "Pc2025mcs",
    role: "editor",
    organizationId: "pavlodar-city-mchs",
    region: "Павлодарская",
    district: "Павлодар",
    fullName: "ГУ ДЧС г. Павлодар",
    isActive: true
  },
  {
    id: "ekibastuz_mchs",
    username: "ekibastuz_mchs",
    password: "Ek2025mcs",
    role: "editor",
    organizationId: "ekibastuz-mchs",
    region: "Павлодарская",
    district: "Экибастуз",
    fullName: "ГУ ДЧС г. Экибастуз",
    isActive: true
  },

  // Северо-Казахстанская область
  {
    id: "sko_mchs",
    username: "sko_mchs",
    password: "Sk2025mcs",
    role: "editor",
    organizationId: "sko-mchs",
    region: "Северо-Казахстанская",
    district: "",
    fullName: "ДЧС СКО",
    isActive: true
  },
  {
    id: "petropavlovsk_mchs",
    username: "petropavlovsk_mchs",
    password: "Pe2025mcs",
    role: "editor",
    organizationId: "petropavlovsk-mchs",
    region: "Северо-Казахстанская",
    district: "Петропавловск",
    fullName: "ГУ ДЧС г. Петропавловск",
    isActive: true
  },

  // Туркестанская область
  {
    id: "turkestan_mchs",
    username: "turkestan_mchs",
    password: "Tu2025mcs",
    role: "editor",
    organizationId: "turkestan-mchs",
    region: "Туркестанская",
    district: "",
    fullName: "ДЧС Туркестанской области",
    isActive: true
  },
  {
    id: "shymkent_mchs",
    username: "shymkent_mchs",
    password: "Sh2025mcs", 
    role: "editor",
    organizationId: "shymkent-mchs",
    region: "Шымкент",
    district: "", 
    fullName: "ГУ ДЧС г. Шымкент",
    isActive: true
  },
  {
    id: "turkestan_city_mchs",
    username: "turkestan_city_mchs",
    password: "Tc2025mcs",
    role: "editor",
    organizationId: "turkestan-city-mchs",
    region: "Туркестанская",
    district: "Туркестан",
    fullName: "ГУ ДЧС г. Туркестан",
    isActive: true
  }
];

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

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Неверный логин или пароль' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
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

  // Инициализация пользователей по умолчанию
  async function initializeDefaultUsers() {
    for (const userData of defaultUsers) {
      try {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (!existingUser) {
          // Use the password from the user data, not defaultSeedPassword
          const hashedPassword = await hashPassword(userData.password);
          await storage.createUser({
            id: userData.username,
            username: userData.username,
            password: hashedPassword,
            fullName: userData.fullName,
            region: userData.region,
            district: userData.district || "",
            role: userData.role as "admin" | "editor" | "reviewer" | "approver",
            organizationId: userData.organizationId || null,
            isActive: true
          });
          console.log(`Создан пользователь: ${userData.username} (${userData.region})`);
        }
      } catch (error) {
        console.error(`Ошибка создания пользователя ${userData.username}:`, error);
      }
    }
  }

  // Инициализируем пользователей при запуске
  initializeDefaultUsers();

  // Маршруты аутентификации
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, fullName, region, role = 'editor' } = req.body;
      
      // Проверяем права администратора
      if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Только администратор может создавать пользователей" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким логином уже существует" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        id: username,
        username,
        password: hashedPassword,
        fullName,
        region,
        role,
        organizationId: `${region}-mchs`,
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

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    res.status(200).json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      region: user.region,
      role: user.role,
      organizationId: user.organizationId
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
      organizationId: user.organizationId
    });
  });

  // Получение списка пользователей (только для админа)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
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
      if (!req.isAuthenticated() || (req.user as any)?.role !== 'admin') {
        return res.status(403).json({ message: "Доступ запрещен" });
      }

      const userId = req.params.id;
      if (userId === 'mchs_admin') {
        return res.status(400).json({ message: "Нельзя деактивировать главного администратора" });
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
    return next();
  }
  res.status(401).json({ message: "Необходима авторизация" });
};