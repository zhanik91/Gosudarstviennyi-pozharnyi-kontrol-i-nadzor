
import { storage } from "../server/storage";
import { db } from "../server/storage/db";

async function test() {
  try {
    console.log("Testing getIncidents...");
    const incidents = await storage.getIncidents({});
    console.log("Success! Found", incidents.length, "incidents.");
  } catch (error) {
    console.error("Error calling getIncidents:", error);
  } finally {
    process.exit(0);
  }
}

test();
