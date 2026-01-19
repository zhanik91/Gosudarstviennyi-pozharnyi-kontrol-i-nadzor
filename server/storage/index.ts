import { UserStorage } from "./user.storage";
import { OrganizationStorage } from "./organization.storage";
import { IncidentStorage } from "./incident.storage";
import { PackageStorage } from "./package.storage";
import { AuditStorage } from "./audit.storage";
import { DocumentStorage } from "./document.storage";
import { ReportFormStorage } from "./report-form.storage";

// Mixin helper to combine classes
function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
          Object.create(null)
      );
    });
  });
}

// Define IStorage interface matching the combined capabilities
// This matches the original interface from server/storage.ts
export interface IStorage extends
  UserStorage,
  OrganizationStorage,
  IncidentStorage,
  PackageStorage,
  ReportFormStorage,
  AuditStorage,
  DocumentStorage {}

// Create a unified class
class CombinedStorage {}

// Apply mixins
applyMixins(CombinedStorage, [
  UserStorage,
  OrganizationStorage,
  IncidentStorage,
  PackageStorage,
  ReportFormStorage,
  AuditStorage,
  DocumentStorage
]);

// Export singleton
export const storage = new CombinedStorage() as IStorage;
