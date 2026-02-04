import { storage } from "./server/storage";
async function check() {
    const orgs = await storage.getAllOrganizations();
    console.log("Root organizations (no parent):", orgs.filter(o => !o.parentId).map(o => ({ id: o.id, name: o.name })));
}
check();
