import "dotenv/config";

console.log("=== Environment Test ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("SUPABASE_DATABASE_URL:", process.env.SUPABASE_DATABASE_URL ? "SET" : "NOT SET");
console.log("SESSION_SECRET:", process.env.SESSION_SECRET ? "SET" : "NOT SET");
console.log("========================");
