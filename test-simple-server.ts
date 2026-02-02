import express from "express";
import { createServer } from "http";

console.log("✅ Creating simple test server...");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "МЧС РК - Server is running!" });
});

app.get("/api/test", (req, res) => {
    res.json({
        status: "ok",
        database: process.env.SUPABASE_DATABASE_URL ? "configured" : "not configured",
        timestamp: new Date().toISOString()
    });
});

const server = createServer(app);
const port = 5000;

server.listen(port, "0.0.0.0", () => {
    console.log(`\n✅ МЧС РК Server is running on http://localhost:${port}`);
    console.log(`✅ Database: ${process.env.SUPABASE_DATABASE_URL ? 'Connected to Supabase' : 'Not configured'}\n`);
});
