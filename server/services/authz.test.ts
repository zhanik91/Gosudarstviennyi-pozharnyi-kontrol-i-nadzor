import test from "node:test";
import assert from "node:assert/strict";
import { assertOrgScope } from "./authz";

type Org = { id: string; parentId?: string | null; name: string; type: "MCHS" | "DCHS" | "DISTRICT" };

const orgs: Org[] = [
  { id: "mchs", name: "МЧС", type: "MCHS" },
  { id: "dchs-1", name: "ДЧС A", type: "DCHS", parentId: "mchs" },
  { id: "dchs-2", name: "ДЧС B", type: "DCHS", parentId: "mchs" },
  { id: "dist-1", name: "Район 1", type: "DISTRICT", parentId: "dchs-1" },
  { id: "dist-2", name: "Район 2", type: "DISTRICT", parentId: "dchs-1" },
  { id: "dist-3", name: "Район 3", type: "DISTRICT", parentId: "dchs-2" },
];

test("MCHS scope includes all org units", () => {
  assert.doesNotThrow(() => assertOrgScope(orgs, "mchs", "dist-3"));
});

test("DCHS scope excludes other regions", () => {
  assert.throws(() => assertOrgScope(orgs, "dchs-1", "dist-3"));
  assert.doesNotThrow(() => assertOrgScope(orgs, "dchs-1", "dist-2"));
});

test("District scope excludes other districts", () => {
  assert.doesNotThrow(() => assertOrgScope(orgs, "dist-1", "dist-1"));
  assert.throws(() => assertOrgScope(orgs, "dist-1", "dist-2"));
});
