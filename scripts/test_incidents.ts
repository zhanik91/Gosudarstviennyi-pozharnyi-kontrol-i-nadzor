
import { storage } from "../server/storage";
import { db } from "../server/storage/db";

async function test() {
  try {
    console.log("Testing getIncidents...");
    const incidents = await storage.getIncidents({});
    const items = Array.isArray(incidents) ? incidents : incidents.items;
    console.log("Success! Found", items.length, "incidents.");
  } catch (error) {
    console.error("Error calling getIncidents:", error);
  } finally {
    process.exit(0);
  }
}

test();
