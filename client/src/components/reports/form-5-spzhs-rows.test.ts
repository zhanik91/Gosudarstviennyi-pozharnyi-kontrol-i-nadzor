import { describe, expect, it } from "vitest";
import { FORM_5_ROWS, type Form5Row } from "@shared/fire-forms-data";

describe("FORM_5_ROWS", () => {
  it("contains only unique row.id values", () => {
    const ids: string[] = [];

    const collectIds = (rows: Form5Row[]) => {
      rows.forEach((row) => {
        ids.push(row.id);
        if (row.children) {
          collectIds(row.children);
        }
      });
    };

    collectIds(FORM_5_ROWS);

    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });
});
