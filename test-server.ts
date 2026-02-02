import express from "express";
import { registerRoutes } from "./server/routes.js";

console.log("Creating express app...");
const app = express(); app.use(express.json());

console.log("Registering routes...");
const server = await registerRoutes(app);

console.log("Routes registered successfully!");
console.log("Server object type:", typeof server);

const port = 5000;
server.listen(port, "0.0.0.0", () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
});
