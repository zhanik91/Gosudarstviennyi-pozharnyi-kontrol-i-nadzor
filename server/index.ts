import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { createServer } from "http";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Статические файлы
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req, res, next) => {
  const start = Date.now();
  const pathUrl = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathUrl.startsWith("/api")) {
      console.log(`${req.method} ${pathUrl} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Временный тестовый роут
app.get("/", (req, res) => {
  res.json({
    message: "МЧС РК - Информационная система государственного пожарного контроля",
    status: "running",
    database: process.env.SUPABASE_DATABASE_URL ? "connected" : "not configured"
  });
});

app.get("/api/test", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

(async () => {
  // TODO: Restore after debugging
  // const server = await registerRoutes(app);

  const server = createServer(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    console.error(err);
  });

  // TODO: Restore Vite setup after debugging
  // if (app.get("env") === "development") {
  //   await setupVite(app, server);
  // } else {
  //   serveStatic(app);
  // }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`\n✅ МЧС РК Server is running on http://localhost:${port}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Database: ${process.env.SUPABASE_DATABASE_URL ? 'Supabase Connected' : 'Not configured'}\n`);
  });
})();
